# Octoshark

[![Version](https://img.shields.io/npm/v/oshark.svg)](https://www.npmjs.com/package/oshark)
![Prerequisite](https://img.shields.io/badge/node-%3E%3D16-blue.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

> Advanced GitHub CLI utilities

## Table of contents

-   [Intstallation](#installation)
-   [Commands](#commands)
    -   General
        -   [connect](#connect)
        -   [protocol](#protocol)
        -   [status](#status)
    -   Repo
        -   [repo comb](#repo-comb)
        -   [repo copy](#repo-copy-cp)
        -   [repo create](#repo-create-c)
        -   [repo delete](#repo-delete-rm)
    -   Secrets
        -   [secrets group create](#secrets-group-create-c)
        -   [secrets group delete](#secrets-group-delete-rm)
        -   [secrets group get](#secrets-group-get)
        -   [secrets group push](#secrets-group-push-p)
    -   Util
        -   [util generate](#util-generate-g)
-   [License](#license)

## Installation

### NPM

```bash
npm i oshark -g
```

### Yarn

```bash
yarn global add oshark
```

## Commands

**Use the `--help` flag if you ever want to view more information about a command**

```bash
oshark <command> --help
```

### connect

Connects Octoshark to your GitHub account

#### Usage

```bash
oshark connect
```

### protocol

Sets the connection protocol that should be used when interacting with repositories using `git`

#### Usage

```bash
oshark protocol "ssh"
```

### status

Displays general information about Octoshark

#### Usage

```bash
oshark status
```

### repo comb

Loops through your repositories and allows you to mark them for deletion/privatization

#### Usage

```bash
oshark repo comb
```

### repo copy (cp)

Copies a repository

#### Usage

```bash
oshark repo cp "user/repo" "user/repo-copy"
```

### repo create (c)

Crates a new repository

#### Usage

```bash
oshark repo c --name "my-awesome-repo" --description "Hello World!"
```

### repo delete (rm)

Deletes a repository

#### Usage

```bash
oshark repo rm "user/my-awesome-repo"
```

### secrets group create (c)

Creates a new local secret group

#### Usage

```bash
oshark secrets group c "shh"
```

### secrets group delete (rm)

Deletes a local secret group

#### Usage

```bash
oshark secrets group rm "shh"
```

### secrets group get

Retrieves a local secret group

#### Usage

```bash
oshark secrets group get "other-shh"
```

### secrets group push (p)

Pushes a local secret group to an existing repository as an environment

#### Usage

```bash
oshark secrets group p "other-shh" "user/repo" "MY_ENV"
```

### util generate (g)

Generates a file/directory from an existing template

#### Usage

```bash
oshark util g "gitignore"
```

## License

MIT © [Juan de Urtubey](https://jdeurt.xyz)
