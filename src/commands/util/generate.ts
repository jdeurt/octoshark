import { writeFileSync } from "node:fs";
import { fmt } from "../../helpers/theme/fmt.js";
import { styles } from "../../helpers/theme/styles.js";
import { command } from "../../structs/command.js";
import { GitHubClient } from "../../structs/github-client.js";
import type { ElementOf } from "../../types/element-of";
import { autoComplete, select } from "../../util/prompt.js";
import { TaskIndicator } from "../../util/task-indicator.js";

const supportedTypes = ["gitignore", "license"] as const;

export default command<{
    type: ElementOf<typeof supportedTypes>;
    name?: string;
}>(
    {
        name: "generate <type> [name]",
        description: "Generates a file/directory from an existing template",
        aliases: ["g"],
        args: [
            {
                name: "type",
                description: "The type of template to use",
                choices: supportedTypes,
                demandOption: true,
            },
            {
                name: "name",
                description: "The name of the template to use",
            },
        ],
        requiresAuthentication: true,
    },
    async ({ argv, ghClient }) => {
        if (!supportedTypes.includes(argv.type)) {
            console.error(
                styles.error(`Unsupported template type '${argv.type}'`)
            );

            process.exit(1);
        }

        if (argv.name === undefined) {
            const templateOptions = await TaskIndicator.promise<string[]>(
                (done, interrupt) =>
                    GitHubClient.flattenPagination<
                        {},
                        Awaited<
                            ReturnType<
                                typeof ghClient["templates"][
                                    | "gitignore"
                                    | "license"]["list"]
                            >
                        >
                    >(
                        ghClient.templates[argv.type].list,
                        {},
                        100,
                        argv.type === "gitignore" ? 1 : Infinity
                    )
                        .then((result) =>
                            result.map((data) => {
                                if (typeof data === "string") {
                                    return data;
                                }

                                return data.key;
                            })
                        )
                        .then(done)
                        .catch((err) => interrupt(err.message)),
                { text: `Retrieving ${argv.type} template options...` }
            );

            argv.name = await autoComplete(
                "Select a template",
                templateOptions.map((template) => ({ name: template }))
            );
        }

        let fileName: string;
        let fileContent: string;

        switch (argv.type) {
            case "gitignore": {
                const data = await TaskIndicator.fromApiMethod(
                    ghClient.templates.gitignore.get,
                    { name: argv.name },
                    { text: "Retrieving gitignore data..." }
                );

                fileName = ".gitignore";
                fileContent = data.source;

                break;
            }

            case "license": {
                const data = await TaskIndicator.fromApiMethod(
                    ghClient.templates.license.get,
                    { license: argv.name },
                    { text: "Retrieving license data..." }
                );

                fileName = "LICENSE";
                fileContent = data.body;

                break;
            }

            default: {
                console.error(styles.error("An unexpected error occured"));

                process.exit(1);
            }
        }

        const filePath = `${process.cwd()}/${fileName}`;

        await TaskIndicator.promise(
            async (done, interrupt) => {
                try {
                    writeFileSync(filePath, fileContent, "utf8");

                    done(undefined);
                } catch (err) {
                    interrupt((err as Error).message);
                }
            },
            {
                text: fmt`Creating file blue:${filePath}...`,
                doneMessage: fmt`Created file v:${filePath} successfully`,
            }
        );
    }
);
