export const anyKey = async () => {
    process.stdin.setRawMode(true);

    return new Promise<void>((resolve) =>
        process.stdin.once("data", (buf) => {
            const bytes = [...buf];

            if (bytes.length > 0 && bytes[0] === 3) {
                console.log("^C");
                process.exit(1);
            }

            process.stdin.setRawMode(false);

            resolve();
        })
    );
};
