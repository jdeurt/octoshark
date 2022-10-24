import chalk from "chalk";
import { command } from "../../structs/command.js";
import { formatPOJO } from "../../helpers/theme/format-pojo.js";
import { fmt } from "../../helpers/theme/fmt.js";

export default command(
    {
        name: "me",
        description: "Displays information about your GitHub profile",
    },
    async ({ ghClient }) => {
        if (ghClient === undefined) {
            console.error(
                fmt`E:${"Octoshark is not connected to your GitHub account. Run 'oshark connect' to remedy this."}`
            );

            return;
        }

        const user = await ghClient.user.authenticated.get();

        console.log(formatPOJO(user));
    }
);
