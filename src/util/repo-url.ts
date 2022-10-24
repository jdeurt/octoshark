export function repoUrl(
    repoOwner: string,
    repoName: string,
    protocol: "ssh" | "https" = "ssh"
) {
    return `${
        protocol === "ssh" ? "git@github.com:" : "https://github.com/"
    }${repoOwner}/${repoName}.git`;
}
