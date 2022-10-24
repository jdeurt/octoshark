import sodium from "libsodium-wrappers";
import { fmt } from "../../../helpers/theme/fmt.js";
import { formatPOJOTable } from "../../../helpers/theme/format-pojo.js";
import { styles } from "../../../helpers/theme/styles.js";
import { command } from "../../../structs/command.js";
import { TaskIndicator } from "../../../util/task-indicator.js";

export default command<{
    name: string;
    repo: string;
    remote_env_name?: string;
}>(
    {
        name: "push <name> <repo> [remote_env_name]",
        description:
            "Pushes a local secret group to an existing repository as an environment",
        aliases: ["p"],
        args: [
            {
                name: "name",
                description: "The name of the group",
                demandOption: true,
            },
            {
                name: "repo",
                description:
                    "The repository to push the group to (OWNER/REPO_NAME)",
                demandOption: true,
            },
            {
                name: "remote_env_name",
                description:
                    "The name to use for the environment instead of the locally defined one",
            },
        ],
        requiresAuthentication: true,
    },
    async ({ argv, config, ghClient }) => {
        const existingGroup = config.document.secretGroups?.[argv.name];

        if (existingGroup === undefined) {
            console.error(styles.error(`Group '${argv.name}' does not exist`));
            console.warn(
                styles.warning(
                    `Create it using 'oshark secrets group create ${argv.name}'`
                )
            );

            process.exit(1);
        }

        const [repoOwner, repoName] = argv.repo.split("/");

        if (!repoOwner || !repoName) {
            console.error(
                fmt`E:${"<repo> argument must match pattern 'OWNER/REPO_NAME' (e.g. username/my-repo)"}`
            );

            process.exit(1);
        }

        const existingRepo = await TaskIndicator.fromApiMethod(
            ghClient.repo.get,
            { owner: repoOwner, repo: repoName },
            {
                text: "Retrieving repository data...",
                doneMessage: "Retrieved repository data successfully",
            }
        );

        const environment = await TaskIndicator.fromApiMethod(
            ghClient.repo.updateEnvironment,
            {
                owner: repoOwner,
                repo: repoName,
                environment_name: argv.remote_env_name ?? argv.name,
            },
            {
                text: `Creating environment '${
                    argv.remote_env_name ?? argv.name
                }' in ${repoOwner}/${repoName}...`,
                doneMessage: `Created environment '${
                    argv.remote_env_name ?? argv.name
                }' in ${repoOwner}/${repoName} successfully`,
            }
        );

        const pubKey = await TaskIndicator.fromApiMethod(
            ghClient.repo.getEnvironmentPublicKey,
            {
                environment_name: environment.name,
                repository_id: existingRepo.id,
            },
            {
                text: "Retrieving environment public key...",
                doneMessage: "Retrieved environment public key successfully",
            }
        );

        await TaskIndicator.promise(
            (done, interrupt) =>
                sodium.ready.then(done).catch((err) => interrupt(err.message)),
            { text: "Initializing libsodium..." }
        );

        const secretUploadPromises: [string, Promise<void>][] = [];

        for (const [key, value] of Object.entries(existingGroup)) {
            secretUploadPromises.push([
                key,
                new Promise((resolve, reject) => {
                    // Convert Secret & Base64 key to Uint8Array.
                    const binkey = sodium.from_base64(
                        pubKey.key,
                        sodium.base64_variants.ORIGINAL
                    );
                    const binsec = sodium.from_string(value);

                    //Encrypt the secret using LibSodium
                    const encBytes = sodium.crypto_box_seal(binsec, binkey);

                    // Convert encrypted Uint8Array to Base64
                    const output = sodium.to_base64(
                        encBytes,
                        sodium.base64_variants.ORIGINAL
                    );

                    ghClient.repo
                        .updateEnvironmentSecret({
                            encrypted_value: output,
                            environment_name: environment.name,
                            key_id: pubKey.key_id,
                            repository_id: existingRepo.id,
                            secret_name: key,
                        })
                        .then(() => resolve())
                        .catch((err) => reject(err.message));
                }),
            ]);
        }

        await TaskIndicator.promise(
            async (done, interrupt, displayed) => {
                try {
                    for (const task of secretUploadPromises) {
                        displayed.text = `Uploading secrets (${task[0]})...`;

                        await task[1];
                    }
                } catch (err) {
                    interrupt((err as Error).message);

                    return;
                }

                done(undefined);
            },
            {
                text: "Uploading secrets...",
                doneMessage: "Uploaded secrets successfully",
            }
        );
    }
);
