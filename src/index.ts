#!/usr/bin/env node
import yargsInit from "yargs";
import { hideBin } from "yargs/helpers";

// Surpress fetch warnings
import "./util/surpress-warnings.js";

import type { CommandLike } from "./types/command-like.js";

import * as commands from "./commands/index.js";
import { isCommandGroup } from "./structs/command-group.js";

const yargs = yargsInit();

yargs.scriptName("oshark");

function initCommandLike(commandLike: CommandLike) {
    yargs.command(
        commandLike.name,
        commandLike.description,
        (yargs) => {
            commandLike.aliases?.forEach((alias) =>
                yargs.alias(alias, commandLike.name)
            );

            if (isCommandGroup(commandLike)) {
                commandLike.children.forEach(initCommandLike);
            } else {
                commandLike.args?.forEach((arg) =>
                    yargs.positional(arg.name, arg)
                );

                commandLike.flags?.forEach((flag) =>
                    yargs.option(flag.long, flag)
                );
            }

            return yargs;
        },
        isCommandGroup(commandLike) ? undefined : commandLike.run
    );
}

for (const key in commands) {
    const commandOrGroup = commands[
        key as keyof typeof commands
    ] as CommandLike;

    initCommandLike(commandOrGroup);
}

yargs.parse(hideBin(process.argv));
