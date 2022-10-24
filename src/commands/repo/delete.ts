import { fmt } from "../../helpers/theme/fmt.js";
import { command } from "../../structs/command.js";
import { confirm } from "../../util/prompt.js";
import { TaskIndicator } from "../../util/task-indicator.js";

export default command<{
    repo: string;
    force?: boolean;
}>(
    {
        name: "delete <repo>",
        description: "Deletes a repository",
        args: [
            {
                name: "repo",
                description: "The repository to delete (OWNER/REPO_NAME)",
                demandOption: true,
            },
        ],
        flags: [
            {
                long: "force",
                short: "f",
                description: "Skips the confirmation prompt",
                type: "boolean",
            },
        ],
        requiresAuthentication: true,
    },
    async ({ argv, ghClient }) => {
        const [repoOwner, repoName] = argv.repo.split("/");

        if (!repoOwner || !repoName) {
            console.error(
                fmt`E:${"<repo> argument must match pattern 'OWNER/REPO_NAME' (e.g. username/my-repo)"}`
            );

            process.exit(1);
        }

        if (!argv.force) {
            const shouldContinute = await confirm(
                fmt`Are you sure you want to d:${"permanently delete"} ${repoOwner}/${repoName}`
            );

            if (!shouldContinute) {
                process.exit(1);
            }
        }

        await TaskIndicator.fromApiMethod(
            ghClient.repo.delete,
            {
                owner: repoOwner,
                repo: repoName,
            },
            {
                text: `Deleting ${repoOwner}/${repoName}...`,
                doneMessage: `Deleted ${repoOwner}/${repoName} successfully`,
            }
        );
    }
);
