import { command } from "../structs/command.js";
import { fmt } from "../helpers/theme/fmt.js";
import { TaskIndicator } from "../util/task-indicator.js";
import { formatPOJOTable } from "../helpers/theme/format-pojo.js";

export default command<{ protocol: "ssh" | "https" }>(
    {
        name: "status",
        description: "Displays general information",
    },
    async ({ ghClient }) => {
        if (ghClient === undefined) {
            console.log("Octoshark is not connected to your GitHub account");
            console.log("Run 'oshark connect' to get started");

            return;
        }

        const { user, rateLimitInfo } = await TaskIndicator.promise<{
            user: Awaited<
                ReturnType<typeof ghClient["user"]["authenticated"]["get"]>
            >;
            rateLimitInfo: Awaited<
                ReturnType<typeof ghClient["status"]["rateLimit"]>
            >;
        }>(
            async (done, interrupt) => {
                try {
                    const user = await ghClient.user.authenticated.get();
                    const rateLimitInfo = await ghClient.status.rateLimit();

                    done({ user, rateLimitInfo });
                } catch (err) {
                    interrupt((err as Error).message);
                }
            },
            { text: "Retrieving info..." }
        );

        console.log(
            fmt`Authenticated as f:${user.login}\n\n${formatPOJOTable(
                rateLimitInfo,
                { vertical: true, horizonal: false }
            )}`
        );
    }
);
