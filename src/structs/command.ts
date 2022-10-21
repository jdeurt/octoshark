import type { ArgumentsCamelCase, PositionalOptions } from "yargs";
import { OctosharkConfig } from "./config.js";
import { GitHubClient } from "../lib/github-api/client.js";
import type { Flag } from "../types/flag";
import type { AuthorizationRequestResponseData } from "../helpers/github-device-auth-flow";

export interface Command<
    T extends Record<string, unknown> = Record<string, unknown>
> {
    name: string;
    description: string;

    aliases?: string[];

    args?: (PositionalOptions & { name: string })[];
    flags?: Flag[];

    run(argv: ArgumentsCamelCase<T>): Promise<void>;
}

export function command<A extends Record<string, unknown>>(
    meta: Omit<Command<A>, "run">,
    run: (params: {
        argv: ArgumentsCamelCase<A>;
        config: OctosharkConfig<{
            auth?: AuthorizationRequestResponseData;
        }>;
        ghClient?: GitHubClient;
    }) => Promise<void>
): Command<A> {
    const config = OctosharkConfig.instance<{
        auth?: AuthorizationRequestResponseData;
    }>();

    const ghClient =
        config.document.auth?.access_token !== undefined
            ? new GitHubClient(config.document.auth.access_token)
            : undefined;

    return {
        ...meta,
        flags: [
            {
                long: "help",
                description: "Show help",
            },
            ...(meta.flags ?? []),
        ],
        run: (argv) =>
            run({ argv, config, ghClient }).then(() => void config.save()),
    };
}
