import connectCommand from "./connect.js";
import protocolCommand from "./protocol.js";
import repoCommandGroup from "./repo/_group.js";
import userCommandGroup from "./user/_group.js";

export const connect = connectCommand;
export const protocol = protocolCommand;
export const repo = repoCommandGroup;
export const user = userCommandGroup;
