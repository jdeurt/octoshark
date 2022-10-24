import connectCommand from "./connect.js";
import protocolCommand from "./protocol.js";
import statusCommand from "./status.js";
import repoCommandGroup from "./repo/_group.js";
import secretsCommandGroup from "./secrets/_group.js";
import userCommandGroup from "./user/_group.js";
import utilCommandGroup from "./util/_group.js";

export const connect = connectCommand;
export const protocol = protocolCommand;
export const repo = repoCommandGroup;
export const secrets = secretsCommandGroup;
export const user = userCommandGroup;
export const util = utilCommandGroup;
export const status = statusCommand;
