import chalk from "chalk";

export const styles = {
    error: chalk.red,
    warning: chalk.yellow,
    success: chalk.green,
    danger: chalk.red,
    dataKey: chalk.bold.whiteBright,
    dataValue: chalk.greenBright,
    focus: chalk.bold.blueBright,
    link: chalk.underline.blueBright,
    blue: chalk.blueBright,
    none: (...text: unknown[]) => text.join(""),
};

export const styleAliases = {
    E: styles.error,
    W: styles.warning,
    S: styles.success,
    d: styles.danger,
    k: styles.dataKey,
    v: styles.dataValue,
    f: styles.focus,
    l: styles.link,
    blue: styles.blue,
    "/": styles.none,
};
