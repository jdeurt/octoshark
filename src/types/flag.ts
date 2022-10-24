export interface Flag<T> {
    long: string;
    description: string;
    short?: string;
    required?: boolean;
    default?: T;
    type?: T extends string
        ? "string"
        : T extends number
        ? "number"
        : T extends boolean
        ? "boolean"
        : "string" | "number" | "boolean";
}
