import { commandGroup } from "../../structs/command-group.js";
import meCommand from "./me.js";
import getCommand from "./get.js";

export default commandGroup(
    { name: "user", description: "Commands for GitHub users." },
    [meCommand, getCommand]
);
