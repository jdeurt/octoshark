import enq from "enquirer";

const { prompt } = enq;

interface Choice {
    name: string;
    message?: string;
    hint?: string;
    disabled?: boolean;
    role?: "separator";
}

function extractResultValue(answerObj: unknown): string {
    return Object.values(answerObj as any)[0] as string;
}

function getArrayPromptAnswer(choices: any) {
    return (result: string) =>
        choices.find((choice: any) => choice.name === result).name as string;
}

export const autoComplete = (
    message: string,
    choices: string[],
    limit?: number
) =>
    prompt({
        type: "autocomplete",
        name: "0",
        message,
        choices,
        maxChoices: limit,
    }) as Promise<string>;

export const confirm = (message: string) =>
    prompt({ type: "confirm", name: "0", message }) as Promise<boolean>;

export const input = (message: string, placeholder?: string) =>
    prompt({
        type: "input",
        name: "0",
        message,
        initial: placeholder,
    }) as Promise<string>;

export const multiSelect = (
    message: string,
    choices: string[],
    limit?: number
) =>
    prompt({
        type: "multiselect",
        name: "0",
        message,
        choices,
        maxChoices: limit,
    }).then((result) => {
        console.log(choices, result);
    });

export const select: (message: string, choices: Choice[]) => Promise<string> = (
    message,
    choices: any
) =>
    prompt({
        type: "select",
        name: "0",
        message,
        choices,
    })
        .then(extractResultValue)
        .then(getArrayPromptAnswer(choices));
