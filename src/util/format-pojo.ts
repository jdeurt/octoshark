import chalk from "chalk";

export const formatPOJO = (pojo: Record<string, unknown>) =>
    Object.entries(pojo)
        .map(
            ([key, value]) => `${chalk.blue(key)}: ${chalk.greenBright(value)}`
        )
        .join("\n");
