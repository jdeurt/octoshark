export type WithParamsFunction<
    T extends Record<string, string> = Record<string, string>
> = (data: T) => string;

export function withParams<
    T extends Record<string, string> = Record<string, string>
>(
    strings: TemplateStringsArray,
    ...expressions: unknown[]
): WithParamsFunction<T> {
    const urlStr = strings.reduce(
        (acc, curr, i) => `${acc}${curr}${expressions[i] ?? ""}`,
        ""
    );

    return function (data) {
        let currUrlStr = urlStr;

        for (const paramName in data) {
            currUrlStr = currUrlStr.replaceAll(
                `{${paramName}}`,
                data[paramName]
            );
        }

        return currUrlStr;
    };
}
