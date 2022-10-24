import ora, { Ora } from "ora";
import { UnwrappedPromise } from "unwrapped-promise";

type TaskCallback<T> = (
    done: (result: T, info?: string) => void,
    interrupt: (reason: string, type?: "warning" | "error") => null,
    displayed: Ora
) => void;

interface TaskIndicatorOptions {
    text: string;
    prefixText?: string;
    doneMessage?: string;
}

export class TaskIndicator<T> {
    private options: TaskIndicatorOptions;
    private spinner: Ora;

    promise: UnwrappedPromise<T>;

    constructor(task: TaskCallback<T>, options: TaskIndicatorOptions) {
        this.options = options;

        this.spinner = ora({
            text: this.options.text,
            prefixText: this.options.prefixText,
        }).start();

        this.promise = new UnwrappedPromise<T>();

        task(this.done.bind(this), this.interrupt.bind(this), this.spinner);
    }

    private done(result: T, info?: string) {
        if (info ?? this.options.doneMessage) {
            this.spinner.succeed(info ?? this.options.doneMessage);
        } else {
            this.spinner.stop();
        }

        this.promise.resolve(result);
    }

    private interrupt(reason: string, type?: "warning" | "error") {
        this.spinner[type === "warning" ? "warn" : "fail"](reason);

        this.promise.reject();

        return null;
    }

    static promise<T>(task: TaskCallback<T>, options: TaskIndicatorOptions) {
        return new TaskIndicator<T>(task, options).promise;
    }

    static fromApiMethod<D, R>(
        apiMethod: (data?: D) => Promise<R>,
        data: D,
        options: TaskIndicatorOptions
    ) {
        return TaskIndicator.promise<R>(
            (done, interrupt) =>
                apiMethod(data)
                    .then(done)
                    .catch((err) => interrupt(err.message)),
            options
        );
    }
}
