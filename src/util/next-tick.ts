export const nextTick = () =>
    new Promise((resolve) => process.nextTick(resolve)) as Promise<void>;
