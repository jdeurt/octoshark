import { randomBytes } from "node:crypto";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import constants from "../config/constants.js";

export function makeTempDir() {
    const dirName = `${randomBytes(8).toString("hex")}-${Date.now()}`;
    const dirPath = `${constants.CONFIG_PATH}/${dirName}`;

    if (existsSync(dirPath)) {
        rmSync(dirPath, { recursive: true, force: true });
    }

    mkdirSync(dirPath);

    return {
        path: dirPath,
        cleanUp: () => rmSync(dirPath, { recursive: true, force: true }),
    };
}
