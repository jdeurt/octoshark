import { commandGroup } from "../../structs/command-group.js";
import envCommandGroup from "./group/_group.js";

export default commandGroup(
    {
        name: "secrets",
        description: "Commands for managing secrets",
    },
    [envCommandGroup]
);
