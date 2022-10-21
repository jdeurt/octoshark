import chalk from "chalk";
import { command } from "../../structs/command.js";
import { formatPOJO } from "../../util/format-pojo.js";

export default command(
    {
        name: "me",
        description:
            "Displays information about the currently authenticated GitHub user.",
    },
    async ({ ghClient }) => {
        if (ghClient === undefined) {
            console.error(
                chalk.red(
                    "Octoshark is not connected to your GitHub account. Run 'oshark connect' to remedy this."
                )
            );

            return;
        }

        const user = await ghClient.user.authenticated.get();

        console.log(formatPOJO(user));
    }
);
