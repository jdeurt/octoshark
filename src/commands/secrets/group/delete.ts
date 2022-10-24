import { fmt } from "../../../helpers/theme/fmt.js";
import { confirm } from "../../../util/prompt.js";
import { styles } from "../../../helpers/theme/styles.js";
import { command } from "../../../structs/command.js";

export default command<{
    name: string;
    force?: boolean;
}>(
    {
        name: "delete <name>",
        description: "Deletes a local secret group",
        args: [
            {
                name: "name",
                description: "The name of the group",
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
    },
    async ({ argv, config }) => {
        const existingGroup = config.document.secretGroups?.[argv.name];

        if (existingGroup === undefined) {
            console.error(
                styles.error(
                    `Cannot delete group '${argv.name}' as it does not exist`
                )
            );

            process.exit(1);
        }

        if (!argv.force) {
            const shouldContinute = await confirm(
                fmt`Are you sure you want to d:${"permanently delete"} group f:${
                    argv.name
                }`
            );

            if (!shouldContinute) {
                process.exit(1);
            }
        }

        Reflect.deleteProperty(config.document.secretGroups!, argv.name);

        console.log(fmt`Deleted group f:${argv.name} successfully`);
    }
);
