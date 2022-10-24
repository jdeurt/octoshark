import { command } from "../structs/command.js";
import { fmt } from "../helpers/theme/fmt.js";

export default command<{ protocol: "ssh" | "https" }>(
    {
        name: "protocol <protocol>",
        description: "Sets the connection protocol",
        args: [
            {
                name: "protocol",
                description: "The new protocol to use",
                choices: ["ssh", "https"],
                demandOption: true,
            },
        ],
    },
    async ({ argv, config }) => {
        config.document.protocol = argv.protocol;

        console.log(fmt`k:${"protocol"} <- v:${argv.protocol}`);
    }
);
