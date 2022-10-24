import { sgex as r } from "sgex";
import terminalLink from "terminal-link";
import { styleAliases } from "./styles.js";

export function fmt(
    strings: TemplateStringsArray,
    ...expressions: (unknown | [string, string])[]
): string {
    let output = "";

    for (let i = 0; i < expressions.length; i++) {
        const text = strings[i];
        const expressionStyleModifier = text.match(r`
            (${Object.keys(styleAliases).join("|")}):$
        `)?.[1] as undefined | keyof typeof styleAliases;
        const expression = expressions[i];

        output +=
            expressionStyleModifier === undefined
                ? `${text}${expression}`
                : `${text.slice(
                      0,
                      -1 * (expressionStyleModifier.length + 1)
                  )}${styleAliases[expressionStyleModifier](
                      Array.isArray(expression)
                          ? terminalLink(expression[0], expression[1])
                          : expression
                  )}`;
    }

    output += strings[strings.length - 1];

    return output;
}
