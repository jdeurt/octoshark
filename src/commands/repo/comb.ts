import { fmt } from "../../helpers/theme/fmt.js";
import { command } from "../../structs/command.js";
import { select, confirm } from "../../util/prompt.js";
import { TaskIndicator } from "../../util/task-indicator.js";

export default command<{ visibility: "all" | "public" | "private" }>(
    {
        name: "comb [visibility]",
        description:
            "Loops through your repositories and allows you to mark them for deletion/privatization",
        args: [
            {
                name: "visibility",
                description:
                    "The visibility of the repositories that should be combed through",
                choices: ["all", "public", "private"],
                default: "all",
            },
        ],
        requiresAuthentication: true,
    },
    async ({ argv, ghClient }) => {
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
                fmt`f:${[currentRepo.name, currentRepo.html_url]}${
                    currentRepo.fork ? ` (fork)` : ""
                }`
            );
            console.log(`☆ ${currentRepo.stargazers_count}`);
            console.log(currentRepo.description ?? "No description");
            console.log();

            console.log(fmt`Visibility: v:${currentRepo.visibility}`);
            console.log(`Watchers: v:${currentRepo.watchers_count}`);
            console.log(`Open issues: v:${currentRepo.open_issues_count}`);
            console.log(`Forks: v:${currentRepo.forks_count}`);
            console.log(`Created: v:${currentRepo.created_at}`);
            console.log(`Last updated: v:${currentRepo.updated_at}`);
            console.log(`Is template?: v:${currentRepo.is_template ?? false}`);
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
                { message: fmt`d:${"Delete"}`, name: "delete" },
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
                            fmt`f:${[idMap[id].name, idMap[id].html_url]}${
                                idMap[id].fork ? ` (fork)` : ""
                            }`
                    )
                    .join("\n\t")}`
            );

        idsToDelete.length > 0 &&
            console.log(
                fmt`The following repositories would be d:${"PERMANENTLY DELETED"}:\n\t${idsToDelete
                    .map(
                        (id) =>
                            fmt`blue:${[idMap[id].name, idMap[id].html_url]}${
                                idMap[id].fork ? ` (fork)` : ""
                            }`
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

                    done(undefined, fmt`blue:${repo.name} -> v:${"private"}`);
                },
                {
                    text: fmt`blue:${repo.name} -> v:${"private"}`,
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

                    done(undefined, fmt`blue:${repo.name} -> d:${"DELETE"}`);
                },
                {
                    text: fmt`blue:${repo.name} -> d:${"DELETE"}`,
                }
            );
        }
    }
);
