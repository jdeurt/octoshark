import { fmt } from "../../../helpers/theme/fmt.js";
import { formatPOJOTable } from "../../../helpers/theme/format-pojo.js";
import { styles } from "../../../helpers/theme/styles.js";
import { command } from "../../../structs/command.js";
import type { KeyValuePair } from "../../../types/key-value-pair.js";
import { confirm, input } from "../../../util/prompt.js";
import { removeWhitespace } from "../../../util/remove-whitespace.js";

export default command<{
    name: string;
    pairs?: string[];
}>(
    {
        name: "create <name> [pairs...]",
        description: "Creates a new local secret group",
        aliases: ["c"],
        args: [
            {
                name: "name",
                description: "The name of the group",
                demandOption: true,
            },
            {
                name: "pairs",
                description:
                    "The key/value pairs that should be assigned to the group (KEY,VALUE)",
            },
        ],
    },
    async ({ argv, config }) => {
        const existingGroup = config.document.secretGroups?.[argv.name];

        if (existingGroup !== undefined) {
            console.error(styles.error(`Group '${argv.name}' already exists`));
            console.warn(
                styles.warning(
                    `If you wish to make changes, you must delete it and create a new one using 'oshark secrets group delete ${argv.name} && oshark secrets group create ${argv.name}'`
                )
            );

            process.exit(1);
        }

        const keyValuePairs =
            argv.pairs?.map(
                (pairStr) =>
                    pairStr.split(",") as KeyValuePair<string | undefined>
            ) ?? [];

        if (argv.pairs === undefined || argv.pairs.length === 0) {
            let isDefiningPairs = true;

            while (isDefiningPairs) {
                const key = await input("Key").then(removeWhitespace);
                const value = await input("Value").then(removeWhitespace);

                keyValuePairs.push([key, value]);

                isDefiningPairs = await confirm("Add more?", true);

                console.log(); // nl
            }
        }

        config.document.secretGroups ??= {};
        config.document.secretGroups[argv.name] = Object.fromEntries(
            keyValuePairs.map(([k, v]) => [k, v ?? ""])
        );

        console.log(
            fmt`Created group: f:${argv.name}\n${formatPOJOTable(
                config.document.secretGroups[argv.name],
                true
            )}`
        );
    }
);
