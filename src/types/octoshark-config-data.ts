import type { AuthorizationRequestResponseData } from "../helpers/github-device-auth-flow";

export interface OctosharkConfigData {
    auth?: AuthorizationRequestResponseData;
    protocol?: "ssh" | "https";
    secrets?: Record<string, string>;
    secretGroups?: Record<string, Record<string, string>>;
}
