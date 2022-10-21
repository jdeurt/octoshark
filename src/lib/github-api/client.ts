import type { Endpoints } from "@octokit/types";

import { withParams } from "../../helpers/with-params.js";
import type { WithParamsFunction } from "../../helpers/with-params";
import type { RequestData } from "../../types/request-data";
import type { RequestMethod } from "../../types/request-method";

export class GitHubClient {
    static baseApiUrl = "https://api.github.com";

    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    protected request<R extends Record<string, unknown>>(
        method: RequestMethod,
        endpoint: string | WithParamsFunction,
        data: Partial<RequestData>
    ): Promise<R> {
        if (typeof endpoint === "function") {
            endpoint = endpoint(data.params ?? {});
        }

        return fetch(
            GitHubClient.baseApiUrl +
                endpoint +
                "?" +
                new URLSearchParams(data.query),
            {
                method,
                headers: {
                    accept: "application/vnd.github+json",
                    authorization: `Bearer ${this.token}`,
                    ...data.headers,
                },
                body: data.body && JSON.stringify(data.body),
            }
        )
            .then((response) => {
                if (response.status >= 400) {
                    throw new Error(`${response.status} ${response.body}`);
                }

                return response;
            })
            .then((response) => response.status === 200 && response.json());
    }

    protected makeEndpointMethod<E extends keyof Endpoints>(endpoint: E) {
        const endpointMethod = (data?: Endpoints[E]["parameters"]) => {
            const ensuredData = structuredClone(data ?? {});

            const endpointParts = endpoint.split(" ") as [
                RequestMethod,
                string
            ];

            const paramNames =
                endpointParts[1]
                    .match(/{.+?}/g)
                    ?.map((matched) => matched.slice(1, -1)) ?? [];

            const paramData = Object.fromEntries(
                Object.entries(ensuredData)
                    .filter(([key]) => paramNames.includes(key))
                    .map(([key, value]) => {
                        Reflect.deleteProperty(ensuredData, key);

                        return [key, (<any>value)?.toString() ?? ""];
                    })
            );
            const queryData = Object.fromEntries(
                Object.entries(ensuredData).filter(([_, value]) =>
                    ["string", "number", "boolean"].includes(typeof value)
                ) as [string, string][]
            );

            return this.request(
                endpointParts[0] as RequestMethod,
                withParams`${endpointParts[1]}`,
                {
                    body:
                        endpointParts[0] === "GET" ||
                        endpointParts[0] === "HEAD"
                            ? undefined
                            : ensuredData,
                    params: paramData,
                    query:
                        endpointParts[0] === "GET" ||
                        endpointParts[0] === "HEAD"
                            ? queryData
                            : undefined,
                }
            ) as Promise<Endpoints[E]["response"]["data"]>;
        };

        return endpointMethod;
    }

    get user() {
        return {
            authenticated: {
                get: this.makeEndpointMethod("GET /user"),
                repos: this.makeEndpointMethod("GET /user/repos"),
            },
            get: this.makeEndpointMethod("GET /users/{username}"),
        };
    }

    get repo() {
        return {
            get: this.makeEndpointMethod("GET /repos/{owner}/{repo}"),
            create: this.makeEndpointMethod("POST /user/repos"),
            createFromTemplate: this.makeEndpointMethod(
                "POST /repos/{template_owner}/{template_repo}/generate"
            ),
            createInOrganization: this.makeEndpointMethod(
                "POST /orgs/{org}/repos"
            ),
            update: this.makeEndpointMethod("PATCH /repos/{owner}/{repo}"),
            delete: this.makeEndpointMethod("DELETE /repos/{owner}/{repo}"),
        };
    }
}
