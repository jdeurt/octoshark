import chalk from "chalk";
import terminalLink from "terminal-link";
import { command } from "../../structs/command.js";
import { select, confirm } from "../../util/prompt.js";
import { TaskIndicator } from "../../util/task-indicator.js";

export default command<{ visibility: "all" | "public" | "private" }>(
    {
        name: "comb [visibility]",
        description:
            "Loops through the authenticated user's repositories and allows you to mark them for deletion/privatization.",
        args: [
            {
                name: "visibility",
                choices: ["all", "public", "private"],
                default: "all",
            },
        ],
    },
    async ({ argv, ghClient }) => {
        if (ghClient === undefined) {
            console.error(
                chalk.red(
                    "Octoshark is not connected to your GitHub account. Run 'oshark connect' to remedy this."
                )
            );

            process.exit(1);
        }

        const getRepo = (page: number) =>
            ghClient.user.authenticated
                .repos({
                    affiliation: "owner",
                    visibility: argv.visibility ?? "all",
                    page,
                    per_page: 1,
                })
                .then((results) => results[0]);

        const actionMap: Record<string, string> = {};
        const idMap: Record<string, Awaited<ReturnType<typeof getRepo>>> = {};

        let currentPage = 1;
        let currentRepo: Awaited<ReturnType<typeof getRepo>> | undefined =
            await getRepo(currentPage);

        while (currentRepo !== undefined) {
            console.clear();

            console.log(
                `${chalk.bold.blueBright(
                    terminalLink(currentRepo.name, currentRepo.html_url)
                )}${currentRepo.fork ? ` (fork)` : ""}`
            );
            console.log(
                `${chalk.bold.yellow("☆")} ${currentRepo.stargazers_count}`
            );
            console.log(currentRepo.description ?? "No description");
            console.log();

            console.log(
                `Visibility: ${chalk.greenBright(currentRepo.visibility)}`
            );
            console.log(
                `Watchers: ${chalk.greenBright(currentRepo.watchers_count)}`
            );
            console.log(
                `Open issues: ${chalk.greenBright(
                    currentRepo.open_issues_count
                )}`
            );
            console.log(`Forks: ${chalk.greenBright(currentRepo.forks_count)}`);
            console.log(
                `Created: ${chalk.greenBright(currentRepo.created_at)}`
            );
            console.log(
                `Last updated: ${chalk.greenBright(currentRepo.updated_at)}`
            );
            console.log(
                `Is template?: ${chalk.greenBright(
                    currentRepo.is_template ?? false
                )}`
            );
            console.log();

            const action: string = await select("Choose an action", [
                { message: "Nothing", name: "nothing" },
                {
                    message: "Go back",
                    name: "go_back",
                    disabled: currentPage === 1,
                },
                {
                    message: "Make private",
                    name: "make_private",
                    disabled: currentRepo.fork || currentRepo.private,
                },
                { message: chalk.red("Delete"), name: "delete" },
                { name: "sep", role: "separator" },
                { message: "Finish", name: "finish" },
            ]);

            if (action !== "go_back" && action !== "finish") {
                actionMap[currentRepo.id] = action;

                idMap[currentRepo.id] = currentRepo;
            }

            if (action === "finish") {
                break;
            }

            currentRepo = await getRepo(
                action === "go_back" ? --currentPage : ++currentPage
            );
        }

        console.clear();

        const idsToMakePrivate = Object.entries(actionMap)
            .filter(([_, action]) => action === "make_private")
            .map(([id]) => id);

        const idsToDelete = Object.entries(actionMap)
            .filter(([_, action]) => action === "delete")
            .map(([id]) => id);

        if (idsToMakePrivate.length === 0 && idsToDelete.length === 0) {
            return;
        }

        idsToMakePrivate.length > 0 &&
            console.log(
                `The following repositories would be made private:\n\t${idsToMakePrivate
                    .map(
                        (id) =>
                            `${chalk.blueBright(
                                terminalLink(idMap[id].name, idMap[id].html_url)
                            )}${idMap[id].fork ? ` (fork)` : ""}`
                    )
                    .join("\n\t")}`
            );

        idsToDelete.length > 0 &&
            console.log(
                `The following repositories would be ${chalk.bold.red(
                    "PERMANENTLY DELETED"
                )}:\n\t${idsToDelete
                    .map(
                        (id) =>
                            `${chalk.blueBright(
                                terminalLink(idMap[id].name, idMap[id].html_url)
                            )}${idMap[id].fork ? ` (fork)` : ""}`
                    )
                    .join("\n\t")}`
            );

        console.log();

        const confirmed = await confirm("Are you sure you want to continue?");

        if (!confirmed) {
            return;
        }

        for (const id of idsToMakePrivate) {
            const repo = idMap[id];

            await TaskIndicator.promise(
                async (done, interrupt) => {
                    const result = await ghClient.repo
                        .update({
                            owner: repo.owner.login,
                            repo: repo.name,
                            private: true,
                        })
                        .catch((err) => interrupt(err.message));

                    if (result === null) {
                        return;
                    }

                    done(
                        undefined,
                        `${chalk.blueBright(repo.name)} -> ${chalk.greenBright(
                            "private"
                        )}`
                    );
                },
                {
                    text: `${chalk.blueBright(
                        repo.name
                    )} -> ${chalk.greenBright("private")}`,
                }
            );
        }

        for (const id of idsToDelete) {
            const repo = idMap[id];

            await TaskIndicator.promise(
                async (done, interrupt) => {
                    const result = await ghClient.repo
                        .delete({
                            owner: repo.owner.login,
                            repo: repo.name,
                        })
                        .then(() => true)
                        .catch((err) => interrupt(err.message));

                    if (result === null) {
                        return;
                    }

                    done(
                        undefined,
                        `${chalk.blueBright(repo.name)} -> ${chalk.bold.red(
                            "DELETE"
                        )}`
                    );
                },
                {
                    text: `${chalk.blueBright(repo.name)} -> ${chalk.bold.red(
                        "DELETE"
                    )}`,
                }
            );
        }
    }
);
