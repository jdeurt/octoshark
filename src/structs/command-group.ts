import { CommandLike } from "../types/command-like.js";

export interface CommandGroup {
    name: string;
    description: string;

    aliases?: string[];

    children: CommandLike[];
}

export function commandGroup(
    meta: Omit<CommandGroup, "children">,
    children: CommandLike[]
): CommandGroup {
    return {
        ...meta,
        children,
    };
}

export function isCommandGroup(
    commandOrGroup: CommandLike
): commandOrGroup is CommandGroup {
    return (commandOrGroup as any).children !== undefined;
}
