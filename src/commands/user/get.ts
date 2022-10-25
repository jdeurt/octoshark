import { command } from "../../structs/command.js";
import { formatPOJO } from "../../helpers/theme/format-pojo.js";
import { fmt } from "../../helpers/theme/fmt.js";

export default command<{
    username: string;
}>(
    {
        name: "get <username>",
        description: "Displays information about a GitHub user",
        args: [
            {
                name: "username",
                description: "The username of the GitHub user",
                demandOption: true,
            },
        ],
        requiresAuthentication: true,
    },
    async ({ argv, ghClient }) => {
        if (!argv.username) {
            console.error(fmt`E:${"<username> argument is required"}`);

            process.exit(1);
        }

        const user = await ghClient.user.get({ username: argv.username });

        console.log(formatPOJO(user));
    }
);
