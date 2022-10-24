import chalk from "chalk";
import { command } from "../../structs/command.js";
import { formatPOJO } from "../../helpers/theme/format-pojo.js";
import { fmt } from "../../helpers/theme/fmt.js";

export default command(
    {
        name: "me",
        description: "Displays information about your GitHub profile",
        aliases: ["m"],
        requiresAuthentication: true,
    },
    async ({ ghClient }) => {
        const user = await ghClient.user.authenticated.get();

        console.log(formatPOJO(user));
    }
);
