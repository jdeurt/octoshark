import { commandGroup } from "../../structs/command-group.js";
import generateCommand from "./generate.js";

export default commandGroup(
    { name: "util", description: "Utility commands", aliases: ["u"] },
    [generateCommand]
);
