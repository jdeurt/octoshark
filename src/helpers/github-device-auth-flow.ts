export interface CodeRequestResponseData {
    device_code: string;
    user_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
}

export interface CodeRequestResponseError {
    error: string;
}

export interface AuthorizationRequestResponseData {
    access_token: string;
    token_type: "bearer";
    scope: string;
}

export interface AuthorizationRequestResponseGenericError {
    error:
        | "authorization_pending"
        | "expired_token"
        | "unsupported_grant_type"
        | "incorrect_client_credentials"
        | "incorrect_device_code"
        | "access_denied"
        | "device_flow_disabled";
    error_description: string;
}

export interface AuthorizationRequestResponseSlowDownError {
    error: "slow_down";
    error_description: string;
    interval: number;
}

export type AuthorizationRequestResponseError =
    | AuthorizationRequestResponseGenericError
    | AuthorizationRequestResponseSlowDownError;

export class GithubDeviceAuthFlow {
    private static codeRequestUrl = "https://github.com/login/device/code";
    private static authorizationRequestUrl =
        "https://github.com/login/oauth/access_token";

    private clientId: string;
    private scope: string[];

    constructor(clientId: string, scope: string[]) {
        this.clientId = clientId;
        this.scope = scope;
    }

    static didAuthorizationRequestSucceed(
        authorizationRequestResult:
            | AuthorizationRequestResponseData
            | AuthorizationRequestResponseError
    ): authorizationRequestResult is AuthorizationRequestResponseData {
        return (
            (authorizationRequestResult as AuthorizationRequestResponseError)
                .error === undefined
        );
    }

    private async makeCodeRequest(): Promise<CodeRequestResponseData> {
        return fetch(
            `${GithubDeviceAuthFlow.codeRequestUrl}/?${new URLSearchParams({
                client_id: this.clientId,
                scope: this.scope.join(","),
            })}`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                },
            }
        ).then((response) => response.json());
    }

    private async makeAuthorizationRequest(
        deviceCode: string
    ): Promise<
        AuthorizationRequestResponseData | AuthorizationRequestResponseError
    > {
        return fetch(
            `${
                GithubDeviceAuthFlow.authorizationRequestUrl
            }/?${new URLSearchParams({
                client_id: this.clientId,
                device_code: deviceCode,
                grant_type: "urn:ietf:params:oauth:grant-type:device_code",
            })}`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                },
            }
        ).then((response) => response.json());
    }

    async init() {
        return this.makeCodeRequest();
    }

    async tryAuth(codeRequestResult: CodeRequestResponseData) {
        let currentInterval = codeRequestResult.interval;

        // >:)
        while (true) {
            const authorizationRequestResult =
                await this.makeAuthorizationRequest(
                    codeRequestResult.device_code
                );

            if (
                GithubDeviceAuthFlow.didAuthorizationRequestSucceed(
                    authorizationRequestResult
                )
            ) {
                return authorizationRequestResult;
            }

            switch (authorizationRequestResult.error) {
                case "slow_down":
                    currentInterval = authorizationRequestResult.interval;
                case "authorization_pending":
                    await new Promise((resolve) =>
                        setTimeout(resolve, currentInterval * 1000)
                    );

                    break;
                default:
                    throw new Error(
                        authorizationRequestResult.error_description
                    );
            }
        }
    }
}
