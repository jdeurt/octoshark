import { commandGroup } from "../../../structs/command-group.js";
import createCommand from "./create.js";
import deleteCommand from "./delete.js";
import getCommand from "./get.js";
import pushCommand from "./push.js";

export default commandGroup(
    {
        name: "group",
        description: "Commands for managing local secret groups",
        aliases: ["g"],
    },
    [createCommand, deleteCommand, getCommand, pushCommand]
);
