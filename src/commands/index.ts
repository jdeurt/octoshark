import connectCommand from "./connect.js";
import repoCommandGroup from "./repo/_group.js";
import userCommandGroup from "./user/_group.js";

export const connect = connectCommand;
export const repo = repoCommandGroup;
export const user = userCommandGroup;
