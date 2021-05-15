# Getting Started with NestJS

## What is NestJS?

NestJS or Nest is a framework for building efficient, scalable `Node.js` server-side applications. It uses progressive JavaScript, is built with and fully supports `TypeScript` (yet still enables developers to code in pure JavaScript) and combines elements of OOP (Object Oriented Programming), FP (Functional Programming), and FRP (Functional Reactive Programming).

Under the hood, NestJS makes use of robust HTTP server frameworks like `Express` (the default) and optionally can be configured to use `Fastify` as well!

NestJS provides a level of abstraction above these common `Node.js` frameworks, but also exposes their APIs directly to the developer. This gives developers the freedom to use the myriad of third-party modules which are available for the underlying platform.

It is written in TypeScript and its structure, especially the modules and dependency injection system, is familiar to Angular.

* https://nestjs.com/
* https://github.com/nestjs

## Prerequisites

[Node.js](https://nodejs.org/en/) and [NPM](https://nodejs.org/en/) are required to work with NestJS and the NestJS CLI.

**Tip**: Use [NVM](https://github.com/nvm-sh/nvm) (Node Version Manager) to manage multiple `Node.js` installations. Use `cURL`or `Wget` to install `NVM`.

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
```

```sh
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
````

To verify that `NVM` has been installed, execute:

```sh
nvm -v
```

Let's use `Node.js` 12 LTS. It's codename is `Erbium`.

https://nodejs.org/en/about/releases/

```sh
nvm install lts/erbium
```

Or use the `use` command if you already have it installed.

```sh
nvm use lts/erbium
```

Verify the `Node.js` installation.

```sh
node -v
npm -v
```

NestJS also plays well with [Yarn](https://yarnpkg.com/). Let's install `Yarn` globally into our current `Node.js` version.

```sh
npm i -g yarn
```

Did that work?

```sh
yarn -v
```

Of course, to write code you also need an IDE. You are free to choose you favorite one, but for this course I'll be using [Visual Studio Code](https://code.visualstudio.com/).

## NestJS CLI

The NestJS CLI is a command-line interface tool that helps you to initialize, develop and maintain your NestJS applications.

https://github.com/nestjs/nest-cli

We will use it to scaffold our project, serve it and build and bundle the application for production distribution.

Let's first install it, again globally into our current `Node.js` version.

```sh
npm i -g @nestjs/cli
```

Let's verify that it works.

```sh
nest
```

This will list all the commands that you can execute via the NestJS CLI. We will be using some of them during this course.

## What We'll Be Building in this Course

We will be creating an API to calculate car insurance quotes for a fictional company called `Acme`.

To calculate a car insurance quote we require 3 input parameters.

* age of the driver
* brand of the car (BMW, Skoda, Mini, Tesla, Porsche...)
* purchase price of the car

Some business rules apply:

- the minimum age of the driver is `18` years
- the value of the car must be `5.000 €` or greater
- the minimum age of the driver can be different per car (e.g. car insurance is not provided for drivers younger than 25 years for a Porsche)

Let's keep the rest simple and assume that the premium of the car insurance is fixed per car brand. We should return a response that includes the yearly and monthly premium. To calculate the monthly premium just divide the yearly price by 12 and round it.

* `BMW`: 150 € / year
* `Skoda`: 100  €  / year
* `Mini`: 150  € / year
* `Tesla`: 250  € / year
* `Porsche`: 500  € / year
( ...etc.)

Only authenticated users should be able to calculate and retrieve car insurance quotes.
