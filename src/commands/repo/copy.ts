import { execaCommandSync } from "execa";
import { fmt } from "../../helpers/theme/fmt.js";
import { styles } from "../../helpers/theme/styles.js";
import { command } from "../../structs/command.js";
import { makeTempDir } from "../../util/make-temp-dir.js";
import { repoUrl } from "../../util/repo-url.js";
import { TaskIndicator } from "../../util/task-indicator.js";

export default command<{
    repo: string;
    new_repo: string;
    fresh?: string;
}>(
    {
        name: "copy <repo> <new_repo>",
        aliases: ["cp"],
        description: "Copies a repository",
        args: [
            {
                name: "repo",
                description: "The repository to move from (OWNER/REPO_NAME)",
                demandOption: true,
            },
            {
                name: "new_repo",
                description: "The repository to move to (OWNER/REPO_NAME)",
                demandOption: true,
            },
        ],
        /*flags: [
            {
                long: "fresh",
                short: "r",
                description:
                    "Initialize the new repository as if it were a fresh repository with the provided first commit message",
                type: "string",
            },
        ],*/
        requiresAuthentication: true,
    },
    async ({ argv, config, ghClient }) => {
        const [oldRepoOwner, oldRepoName] = argv.repo.split("/");
        const [newRepoOwner, newRepoName] = argv.new_repo.split("/");

        if (!oldRepoOwner || !oldRepoName || !newRepoOwner || !newRepoName) {
            console.error(
                fmt`E:${"<repo> and <new_repo> arguments must match pattern 'OWNER/REPO_NAME' (e.g. username/my-repo)"}`
            );

            process.exit(1);
        }

        const tempDir = makeTempDir();

        const user = await TaskIndicator.fromApiMethod(
            ghClient.user.authenticated.get,
            {},
            {
                text: "Retrieving user data...",
                doneMessage: "Retrieved user data successfully",
            }
        );

        const oldRepo = await TaskIndicator.fromApiMethod(
            ghClient.repo.get,
            {
                owner: oldRepoOwner,
                repo: oldRepoName,
            },
            {
                text: `Retrieving information for repository ${oldRepoOwner}/${oldRepoName}...`,
                doneMessage: `Retrieved information for repository ${oldRepoOwner}/${oldRepoName} successfully`,
            }
        );

        const newOwner = await TaskIndicator.fromApiMethod(
            ghClient.user.get,
            { username: newRepoOwner },
            {
                text: `Retrieving information for ${newRepoOwner}...`,
                doneMessage: `Retrieved information for ${newRepoOwner} successfully`,
            }
        );

        const isNewOwnerOrganization = newOwner.type === "Organization";

        // Cannot move repositories to user accounts that are not the authenticated one
        if (!isNewOwnerOrganization && newRepoOwner !== user.login) {
            console.error(
                styles.error(
                    "Unable to copy repository. Invalid target destination (user mismatch)"
                )
            );

            process.exit(1);
        }

        await TaskIndicator.promise(
            async (done, interrupt, displayed) => {
                try {
                    displayed.text = `Copying repository (creating ${newRepoOwner}/${newRepoName})...`;
                    let createResult: Awaited<
                        ReturnType<
                            typeof ghClient["repo"][
                                | "createInOrganization"
                                | "create"]
                        >
                    >;
                    if (isNewOwnerOrganization) {
                        createResult = await ghClient.repo.createInOrganization(
                            {
                                org: newRepoOwner,
                                name: newRepoName,
                                description: oldRepo.description ?? undefined,
                                private: oldRepo.private,
                            }
                        );
                    } else {
                        createResult = await ghClient.repo.create({
                            name: newRepoName,
                            description: oldRepo.description ?? undefined,
                            private: oldRepo.private,
                        });
                    }

                    displayed.text =
                        "Copying repository (making local copy)...";
                    const cloneResult =
                        argv.fresh === undefined
                            ? execaCommandSync(
                                  `git clone --bare ${repoUrl(
                                      oldRepo.owner.login,
                                      oldRepo.name,
                                      config.document.protocol
                                  )} .`,
                                  { cwd: tempDir.path }
                              )
                            : (() => {
                                  const result = { failed: false };

                                  result.failed =
                                      result.failed &&
                                      execaCommandSync(
                                          `git clone ${repoUrl(
                                              oldRepo.owner.login,
                                              oldRepo.name,
                                              config.document.protocol
                                          )} .`,
                                          { cwd: tempDir.path }
                                      ).failed;

                                  result.failed =
                                      result.failed &&
                                      execaCommandSync("rm -rf ./.git", {
                                          cwd: tempDir.path,
                                      }).failed;

                                  result.failed =
                                      result.failed &&
                                      execaCommandSync("git init", {
                                          cwd: tempDir.path,
                                      }).failed;

                                  result.failed =
                                      result.failed &&
                                      execaCommandSync("git add .", {
                                          cwd: tempDir.path,
                                      }).failed;

                                  result.failed =
                                      result.failed &&
                                      execaCommandSync(
                                          `git commit -m "${
                                              argv.fresh || "initial commit"
                                          }"`,
                                          { cwd: tempDir.path }
                                      ).failed;

                                  result.failed =
                                      result.failed &&
                                      execaCommandSync(
                                          `git remote add origin ${repoUrl(
                                              createResult.owner.login,
                                              createResult.name,
                                              config.document.protocol
                                          )}`,
                                          { cwd: tempDir.path }
                                      ).failed;

                                  return result;
                              })();
                    if (cloneResult.failed) {
                        interrupt(
                            `Failed to make local copy of ${oldRepoOwner}/${oldRepoName} (do you have clone permissions?)`
                        );

                        // console.error(cloneResult.stderr);

                        return;
                    }

                    displayed.text =
                        "Copying repository (pushing local copy)...";
                    const pushResult =
                        argv.fresh === undefined
                            ? execaCommandSync(
                                  `git push --mirror ${repoUrl(
                                      createResult.owner.login,
                                      createResult.name,
                                      config.document.protocol
                                  )}`,
                                  { cwd: tempDir.path }
                              )
                            : execaCommandSync(
                                  `git push -u --force origin main`,
                                  { cwd: tempDir.path }
                              );
                    if (pushResult.failed) {
                        interrupt(
                            `Failed to push local copy of ${oldRepoOwner}/${oldRepoName} to ${newRepoOwner}/${newRepoName}`
                        );

                        // console.error(cloneResult.stderr);

                        return;
                    }

                    displayed.text = "Copying repository (cleaning up)...";
                    tempDir.cleanUp();

                    done(
                        undefined,
                        fmt`Copied repository successfully (k:${`${oldRepoOwner}/${oldRepoName}`} -> v:${`${newRepoOwner}/${newRepoName}`})`
                    );
                } catch (err) {
                    interrupt((err as Error).message);
                }
            },
            {
                text: `Copying repository (creating ${newRepoOwner}/${newRepoName})...`,
            }
        ).catch(() => {
            tempDir.cleanUp();

            process.exit(1);
        });
    }
);
