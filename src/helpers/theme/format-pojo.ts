import { table } from "table";
import { fmt } from "./fmt.js";
import { styles } from "./styles.js";

export const formatPOJO = (pojo: Record<string, unknown>): string =>
    Object.entries(pojo)
        .map(([key, value]) => fmt`k:${key}: v:${value}`)
        .join("\n");

export const formatPOJOTable = (
    pojo: Record<string, unknown>,
    hideLines: boolean | { vertical: boolean; horizonal: boolean } = false
): string =>
    table(
        Object.entries(pojo).map(([key, value]) => [
            styles.dataKey(key),
            typeof value === "object" && value !== null
                ? formatPOJOTable(
                      Object.fromEntries(
                          Object.entries(value).map(
                              ([childKey, childValue]) => [
                                  `${key}.${childKey}`,
                                  childValue,
                              ]
                          )
                      ),
                      true
                  )
                : styles.dataValue(value),
        ]),
        {
            drawVerticalLine: () =>
                typeof hideLines === "boolean"
                    ? !hideLines
                    : !hideLines.vertical,
            drawHorizontalLine: () =>
                typeof hideLines === "boolean"
                    ? !hideLines
                    : !hideLines.horizonal,
        }
    );
