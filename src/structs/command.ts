import type { ArgumentsCamelCase, PositionalOptions } from "yargs";
import { OctosharkConfig } from "./config.js";
import { GitHubClient } from "../lib/github-api/client.js";
import type { Flag } from "../types/flag";
import type { AuthorizationRequestResponseData } from "../helpers/github-device-auth-flow";
import { fmt } from "../helpers/theme/fmt.js";

export interface Command<
    T extends Record<string, unknown> = Record<string, unknown>
> {
    name: string;
    description: string;

    aliases?: string[];

    args?: (PositionalOptions & { name: string })[];
    flags?: Flag<unknown>[];

    run(argv: ArgumentsCamelCase<T>): Promise<void>;
}

export function command<A extends Record<string, unknown>>(
    meta: Omit<Command<A>, "run"> & { requiresAuthentication?: false },
    run: (params: {
        argv: ArgumentsCamelCase<A>;
        config: OctosharkConfig<{
            auth?: AuthorizationRequestResponseData;
            protocol?: "ssh" | "https";
        }>;
        ghClient?: GitHubClient;
    }) => Promise<void>
): Command<A>;
export function command<A extends Record<string, unknown>>(
    meta: Omit<Command<A>, "run"> & { requiresAuthentication: true },
    run: (params: {
        argv: ArgumentsCamelCase<A>;
        config: OctosharkConfig<{
            auth?: AuthorizationRequestResponseData;
            protocol?: "ssh" | "https";
        }>;
        ghClient: GitHubClient;
    }) => Promise<void>
): Command<A>;
export function command<A extends Record<string, unknown>>(
    meta: Omit<Command<A>, "run"> & { requiresAuthentication?: boolean },
    run: any // Don't wanna deal with typing this
): Command<A> {
    const config = OctosharkConfig.instance<{
        auth?: AuthorizationRequestResponseData;
        protocol?: "ssh" | "https";
    }>();

    const ghClient =
        config.document.auth?.access_token !== undefined
            ? new GitHubClient(config.document.auth.access_token)
            : undefined;

    return {
        ...meta,
        run: (argv) => {
            if (meta.requiresAuthentication) {
                if (ghClient === undefined) {
                    console.error(
                        fmt`E:${"Octoshark is not connected to your GitHub account. Run 'oshark connect' to remedy this."}`
                    );

                    process.exit(1);
                }
            }

            return run({ argv, config, ghClient }).then(
                () => void config.save()
            );
        },
    };
}
