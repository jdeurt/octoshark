import { commandGroup } from "../../structs/command-group.js";
import combCommand from "./comb.js";
import createCommand from "./create.js";
import deleteCommand from "./delete.js";

export default commandGroup(
    {
        name: "repo",
        description: "Commands for GitHub repositories",
        aliases: ["r"],
    },
    [combCommand, createCommand, deleteCommand]
);
