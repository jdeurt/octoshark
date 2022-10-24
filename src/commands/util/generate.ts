import { command } from "../../structs/command.js";

const supportedTypes = ["gitignore", "gi", "license", "l"] as const;

export default command<{ type: typeof supportedTypes; name?: string }>(
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
    async ({ argv, ghClient }) => {}
);
