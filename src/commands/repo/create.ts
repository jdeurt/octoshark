import { execaCommand } from "execa";
import * as yup from "yup";
import { fmt } from "../../helpers/theme/fmt.js";
import { GitHubClient } from "../../lib/github-api/client.js";
import { command } from "../../structs/command.js";
import { confirm, input, select } from "../../util/prompt.js";
import { TaskIndicator } from "../../util/task-indicator.js";

export default command<{
    name?: string;
    description?: string;
    private?: boolean;
    template?: string;
    org?: string;
    clone?: boolean;
}>(
    {
        name: "create",
        description: "Creates a new repository",
        flags: [
            {
                long: "name",
                short: "n",
                description: "The repository name",
                type: "string",
            },
            {
                long: "desc",
                short: "d",
                description: "The repository description",
                type: "string",
            },
            {
                long: "private",
                short: "p",
                description: "Whether or not to make the repository private",
                type: "boolean",
            },
            {
                long: "template",
                short: "t",
                description:
                    "The template to use when creating the repository (OWNER/REPO_NAME)",
                type: "string",
            },
            {
                long: "org",
                short: "o",
                description: "The organization to create the repository under",
                type: "string",
            },
            {
                long: "clone",
                short: "c",
                description:
                    "Whether to clone the repository into the current directory after it is created",
                type: "boolean",
            },
        ],
    },
    async ({ argv, ghClient }) => {
        if (ghClient === undefined) {
            console.error(
                fmt`E:${"Octoshark is not connected to your GitHub account. Run 'oshark connect' to remedy this."}`
            );

            process.exit(1);
        }

        const user = await TaskIndicator.fromApiMethod(
            ghClient.user.authenticated.get,
            {},
            { text: "Fetching user info.." }
        );

        if (!argv.name) {
            argv.name = await input("Repository name (required)").then(
                (value) => value.replace(/\s+/g, "")
            );
        }

        if (argv.description === undefined) {
            argv.description = await input("Repository description");
        }

        if (argv.private === undefined) {
            argv.private = await confirm("Make repositoy private?");
        }

        if (argv.template === undefined) {
            const wantsTemplate = await confirm("Use template?");

            if (wantsTemplate) {
                const templateOptions = await TaskIndicator.promise<
                    Awaited<
                        ReturnType<
                            typeof ghClient["user"]["authenticated"]["repos"]
                        >
                    >
                >(
                    async (done, interrupt) => {
                        const repos = await GitHubClient.flattenPagination(
                            ghClient.user.authenticated.repos,
                            {},
                            100
                        ).catch((err) => interrupt(err.message));

                        if (repos === null) {
                            return;
                        }

                        done(repos.filter((repo) => repo.is_template === true));
                    },
                    { text: "Fetching user templates..." }
                );

                argv.template = await select(
                    "Template",
                    templateOptions.map((templateRepo) => ({
                        name: `${templateRepo.owner.login}/${templateRepo.name}`,
                    }))
                ).then((value) => value.replace(/\s+/g, ""));
            }
        }

        if (argv.org === undefined) {
            const wantsOrg = await confirm("Create under organization?");

            if (wantsOrg) {
                const orgOptions = await TaskIndicator.promise<
                    Awaited<
                        ReturnType<
                            typeof ghClient["user"]["authenticated"]["orgs"]
                        >
                    >
                >(
                    async (done, interrupt) => {
                        const orgs = await GitHubClient.flattenPagination(
                            ghClient.user.authenticated.orgs,
                            {},
                            100
                        ).catch((err) => interrupt(err.message));

                        if (orgs === null) {
                            return;
                        }

                        done(orgs);
                    },
                    { text: "Fetching organizations..." }
                );

                argv.org = await select(
                    "Organization",
                    orgOptions.map((org) => ({
                        name: org.login,
                    }))
                ).then((value) => value.replace(/\s+/g, ""));
            }
        }

        const validationError = await yup
            .object({
                name: yup.string().required(),
                description: yup.string().notRequired(),
                private: yup.bool().notRequired(),
                template: yup.string().notRequired(),
                org: yup.string().notRequired(),
                clone: yup.bool().notRequired(),
            })
            .validate(argv)
            .then(() => null)
            .catch((err) => {
                return err as yup.ValidationError;
            });

        if (validationError) {
            console.error(
                fmt`E:${`Failed to validate options: ${validationError.message}`}`
            );

            process.exit(1);
        }

        let createdRepo: Awaited<ReturnType<typeof ghClient["repo"]["create"]>>;

        if (argv.template) {
            createdRepo = await TaskIndicator.fromApiMethod(
                ghClient.repo.createFromTemplate,
                {
                    template_owner: argv.template.split("/")[0],
                    template_repo: argv.template.split("/")[1],
                    name: argv.name!,
                    description: argv.description || undefined,
                    private: argv.private,
                    owner: argv.org || undefined,
                },
                {
                    text: `Creating ${user.login}/${argv.name}...`,
                    doneMessage: `Created ${user.login}/${argv.name} successfully`,
                }
            );
        } else if (argv.org) {
            createdRepo = await TaskIndicator.fromApiMethod(
                ghClient.repo.createInOrganization,
                {
                    org: argv.org,
                    name: argv.name!,
                    description: argv.description || undefined,
                    private: argv.private,
                },
                {
                    text: `Creating ${argv.org}/${argv.name}...`,
                    doneMessage: `Created ${argv.org}/${argv.name} successfully`,
                }
            );
        } else {
            createdRepo = await TaskIndicator.fromApiMethod(
                ghClient.repo.create,
                {
                    name: argv.name!,
                    description: argv.description || undefined,
                    private: argv.private,
                },
                {
                    text: `Creating ${user.login}/${argv.name}...`,
                    doneMessage: `Created ${user.login}/${argv.name} successfully`,
                }
            );
        }

        if (argv.clone) {
            await TaskIndicator.promise(
                async (done, interrupt) => {
                    execaCommand(
                        `git clone git@github.com:${createdRepo.owner}/${createdRepo.name}.git`
                    )
                        .then(() => done(undefined))
                        .catch((err) => interrupt(err.message));
                },
                {
                    text: `Cloning ${createdRepo.owner}/${createdRepo.name}...`,
                    doneMessage: `Cloned ${createdRepo.owner}/${
                        createdRepo.name
                    } into ${process.cwd()} successfully`,
                }
            );
        } else {
            console.log(
                `Clone this repository by running:\n\n\tgit clone git@github.com:${createdRepo.owner}/${createdRepo.name}.git\n`
            );
        }
    }
);
