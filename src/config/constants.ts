import { resolve } from "node:path";
import { homedir } from "node:os";

export default Object.freeze({
    CONFIG_PATH: resolve(homedir(), ".octoshark"),
});
