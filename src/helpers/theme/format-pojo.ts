import { fmt } from "./fmt.js";

export const formatPOJO = (pojo: Record<string, unknown>) =>
    Object.entries(pojo)
        .map(([key, value]) => fmt`k:${key}: v:${value}`)
        .join("\n");
