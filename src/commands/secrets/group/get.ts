import { fmt } from "../../../helpers/theme/fmt.js";
import { formatPOJOTable } from "../../../helpers/theme/format-pojo.js";
import { styles } from "../../../helpers/theme/styles.js";
import { command } from "../../../structs/command.js";

export default command<{
    name: string;
}>(
    {
        name: "get <name>",
        description: "Retrieves a local secret group",
        args: [
            {
                name: "name",
                description: "The name of the group",
                demandOption: true,
            },
        ],
    },
    async ({ argv, config }) => {
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

        console.log(
            fmt`Group: f:${argv.name}\n${formatPOJOTable(
                Object.fromEntries(Object.entries(existingGroup)),
                true
            )}`
        );
    }
);
