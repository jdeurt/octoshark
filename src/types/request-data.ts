export interface RequestData {
    headers: Record<string, string>;
    query: Record<string, string>;
    body: Record<string, unknown>;
    params: Record<string, string>;
}
