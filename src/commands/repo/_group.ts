import { commandGroup } from "../../structs/command-group.js";
import combCommand from "./comb.js";

export default commandGroup(
    { name: "repo", description: "Commands for GitHub repositories." },
    [combCommand]
);
