import { homedir } from "node:os";
import {
    parse as parsePath,
    resolve as resolvePath,
    ParsedPath,
} from "node:path";
import { readFileSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { encode, decode } from "ini";

export class Config<T extends Record<string, any>> {
    private static _instance?: Config<any>;

    private parsedConfigPath: ParsedPath;
    strConfigPath: string;

    document: T;

    private constructor() {
        this.strConfigPath = resolvePath(homedir(), ".octoshark", "config.ini");
        this.parsedConfigPath = parsePath(this.strConfigPath);

        // create config folders and file if they do not exist
        if (!existsSync(this.strConfigPath)) {
            mkdirSync(this.parsedConfigPath.dir, { recursive: true });

            writeFileSync(
                this.strConfigPath,
                "; Octoshark configuration file\n",
                "utf8"
            );
        }

        this.document = decode(readFileSync(this.strConfigPath, "utf8")) as T;
    }

    static instance<T extends Record<string, any>>(): Config<T> {
        Config._instance ??= new Config<T>();

        return Config._instance;
    }

    refresh(): Config<T> {
        this.document = decode(readFileSync(this.strConfigPath, "utf8")) as T;

        return this;
    }

    save() {
        writeFileSync(this.strConfigPath, encode(this.document), "utf8");

        return this;
    }
}
