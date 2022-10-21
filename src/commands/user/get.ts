import chalk from "chalk";
import { command } from "../../structs/command.js";
import { formatPOJO } from "../../util/format-pojo.js";

export default command<{
    username: string;
}>(
    {
        name: "get <username>",
        description: "Displays information about a GitHub user.",
    },
    async ({ argv, ghClient }) => {
        if (ghClient === undefined) {
            console.error(
                chalk.red(
                    "Octoshark is not connected to your GitHub account. Run 'oshark connect' to remedy this."
                )
            );

            return;
        }

        if (!argv.username) {
            console.warn(argv);
            console.error(chalk.red("<username> argument is required."));

            process.exit(1);
        }

        const user = await ghClient.user.get({ username: argv.username });

        console.log(formatPOJO(user));
    }
);
