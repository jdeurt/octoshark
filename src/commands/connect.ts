import { table } from "table";
import constants from "../config/github.js";
import {
    AuthorizationRequestResponseData,
    GithubDeviceAuthFlow,
} from "../helpers/github-device-auth-flow.js";
import { command } from "../structs/command.js";
import { GitHubClient } from "../structs/github-client.js";
import { anyKey } from "../util/any-key.js";
import { TaskIndicator } from "../util/task-indicator.js";
import { fmt } from "../helpers/theme/fmt.js";

export default command(
    {
        name: "connect",
        description: "Connects Octoshark to your GitHub account",
    },
    async ({ config }) => {
        const flow = new GithubDeviceAuthFlow(
            constants.GITHUB_CLIENT_ID,
            constants.GITHUB_AUTH_SCOPE
        );

        const verification = await flow.init();

        console.log(
            table(
                [
                    [" ", " ", " ", " ", " "],
                    [" ", " ", verification.user_code, " ", " "],
                    [" ", " ", " ", " ", " "],
                ],
                {
                    drawVerticalLine: (index, length) =>
                        index === 0 || index === length,
                    drawHorizontalLine: (index, length) =>
                        index === 0 || index === length,
                }
            )
        );

        console.log("Type the code above into the following page:");
        console.log(fmt`l:${verification.verification_uri}`);

        console.log("\nPress any key to continue...");
        await anyKey();
        console.log();

        const authResult =
            await TaskIndicator.promise<AuthorizationRequestResponseData>(
                async (done, interrupt) => {
                    const result = await flow
                        .tryAuth(verification)
                        .catch((err) => interrupt(err.message));

                    if (!result) {
                        return;
                    }

                    const client = new GitHubClient(result.access_token);
                    const user = await client.user.authenticated.get();

                    done(result, `Authenticated as ${user.login}!`);
                },
                {
                    text: "Waiting for authentication...",
                }
            );

        config.document.auth = authResult;

        console.log(
            `Your Octoshark configuration file can be found at ${config.strConfigPath}.`
        );
    }
);
