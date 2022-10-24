import type { ArgumentsCamelCase, PositionalOptions } from "yargs";
import { Config } from "./config.js";
import { GitHubClient } from "./github-client.js";
import type { Flag } from "../types/flag";
import { fmt } from "../helpers/theme/fmt.js";
import type { OctosharkConfigData } from "../types/octoshark-config-data";

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
        config: Config<OctosharkConfigData>;
        ghClient?: GitHubClient;
    }) => Promise<void>
): Command<A>;
export function command<A extends Record<string, unknown>>(
    meta: Omit<Command<A>, "run"> & { requiresAuthentication: true },
    run: (params: {
        argv: ArgumentsCamelCase<A>;
        config: Config<OctosharkConfigData>;
        ghClient: GitHubClient;
    }) => Promise<void>
): Command<A>;
export function command<A extends Record<string, unknown>>(
    meta: Omit<Command<A>, "run"> & { requiresAuthentication?: boolean },
    run: any // Don't wanna deal with typing this
): Command<A> {
    const config = Config.instance<OctosharkConfigData>();

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
