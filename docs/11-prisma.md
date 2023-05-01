# Prisma

## Introducing Prisma

[Prisma](http://www.prisma.io) is an [open-source](https://github.com/prisma/prisma) next-generation ORM. It can be used in any `Node.js`or `TypeScript` based backend application.

Using a [Prisma schema file](https://www.prisma.io/docs/concepts/components/prisma-schema) you define your models using Prisma's data modeling language. Apart from the models the schema also contains the connection to the database and a generator.

After you declared the database connection, the generator, and your models you use the Prisma CLI to generate a Prima Client which provides full type-safety out of the box. Using the Prisma Client you can send queries to your database.

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// retrieve a car insurance quote
const quote = await prisma.carInsuranceQuote.findUnique({ where: { id: 1 } });

// create a car insurance quote
const newQuote = await prisma.carInsuranceQuote.create({
  data: {
    ageOfDriver: 18,
    monthlyPremium: 10,
    yearlyPremium: 120,
    createdOn: new Date(),
  },
});
```

## Prisma Schema

At the moment the car insurance quotes are persisted to a PostgreSQL database using [Knex.js](./10-add-postgresql-with-knex.md). Let's switch to Prisma.

First, install the Prisma Client package.

```sh
yarn add @prisma/client
```

Next, add the Prisma CLI as a development dependency.

```sh
yarn add prisma -D
```

Using the CLI create a Prisma schema file.

```sh
npx prisma init
```

This will create a `prisma` folder in the root of the repository containing a `schema.prisma` file. Initially the schema file only contains a [generator](https://www.prisma.io/docs/concepts/components/prisma-schema/generators) and [datasource](https://www.prisma.io/docs/concepts/components/prisma-schema/data-sources).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Note the usage of the `DATABASE_URL` environment variable in the Prisma schema (`env("DATABASE_URL")`). It contains the URL (connection string) to our PostgreSQL database. The format is:

```sh
postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
```

For example:

```sh
export DATABASE_URL=postgresql://postgres:abc123@localhost:5432/acme
```

This new environment variable contains all the information declared in the `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST` and `DB_NAME` environment variables created earlier.

As explained in a previous chapter I use [direnv](https://direnv.net/) to define my environment variables, but you can also use the [`.env`](https://www.prisma.io/docs/guides/development-environment/environment-variables) file created by the Prisma CLI at the root of your project. If you don't use the `.env` file you can delete it. Whichever method you prefer, make sure to declare the `DATABASE_URL` environment variable before continuing.

We can write the data model (Prisma model) manually and use [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate) to generate `.sql` migration scripts to keep our database in sync with the Prisma schema.
However, we are working with an existing database that was created using the `init.sql` script. We prefer to migrate the database schema ourselves instead of using Prisma Migrate. In that case, we can generate the Prisma models via introspection. In the former case the Prisma schema is the single source of truth and in the latter it's the database schema.

```sh
npx prisma db pull
```

This will introspect the database using the datasource defined in the Prisma schema and write the models to the schema.

The updated Prisma schema now contains a model for the `car_insurance_quote` table.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model car_insurance_quote {
  id             Int      @id @default(autoincrement())
  ageofdriver    Int
  monthlypremium Decimal  @db.Decimal(12, 2)
  yearlypremium  Decimal  @db.Decimal(12, 2)
  createdon      DateTime @db.Timestamp(6)
}
```

Let's tweak the `car_insurance_quote` a bit.

```prisma
model CarInsuranceQuote {
  id             Int      @id @default(autoincrement())
  ageOfDriver    Int      @map("ageofdriver")
  monthlyPremium Decimal  @map("monthlypremium") @db.Decimal(12, 2)
  yearlyPremium  Decimal  @map("yearlypremium") @db.Decimal(12, 2)
  createdOn      DateTime @map("createdon") @db.Timestamp(6)

  @@map("car_insurance_quote")
}
```

Voila, we changed the name of the model and the fields with the `@map` and `@@map` attributes. They allow you to tune the generated models of your Prisma Client by decoupling the model and field names for the table and column names in the underlying database.

## Prisma Client

Whenever you update the Prisma schema you must regenerate your Prisma Client.

```sh
npx prisma generate
```

This generates the Prisma Client into the `./node_modules/.prisma/client` directory complete with type declarations for TypeScript to ensure your application stays type-safe.

```sh
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (4.2.1 | library) to ./node_modules/@prisma/client in 69ms
You can now start using Prisma Client in your code. Reference: https://pris.ly/d/client

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```

We can now use the generated Prisma Client to query our database.

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const quote = await prisma.carInsuranceQuote.findUnique({ where: { id: 1 } });
```

Let's integrate it with our NestJS application. To start, create a new module called `prisma`.

```sh
nest g mo prisma
```

The new module (`./prisma/prisma.module.ts`) is automatically imported into the main app module (`AppModule`) for us by the Nest CLI.

Next generate a new service, also called `prisma`.

```sh
nest g s prisma prisma --no-spec --flat
```

The new service (`PrismaService`) is automatically registered as a provider in the `PrismaModule`, but we also need to export it so add it to the `exports` array. Afterward, the new module defined in the `./prisma/prisma.module.ts` file should look as follows:

```ts
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

The `PrismaService` will serve as an abstraction of the Prisma Client. Through NestJS's dependency injection system, we can inject it into other providers.
Extend the service from the generated `PrismaClient` and implement NestJS's `OnModuleInit` interface. In the `onModuleInit()` function we connect to the underlying database via the `PrismaClient`'s `$connect()` method.

**Remark**: We don't implement the NestJS `OnModuleDestroy` interface to disconnect from the database. Prisma has its own shutdown hooks where it will destroy the connection. However, Prisma interferes with NestJS `enableShutdownHooks`. Prisma listens for shutdown signals and will call `process.exit()` before your application shutdown hooks fire. To deal with this, add a listener for Prisma's `beforeExit` event.

You can read more information here:

https://docs.nestjs.com/recipes/prisma#issues-with-enableshutdownhooks

```ts
import { INestApplication, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

NestJS will call `onModuleInit()` once when the `PrismaModule` is loaded on application startup and connect to the database. The `PrismaClient`, and its underlying database connection, can be shared by injecting the `PrismaService` into other providers.

## Persisting the Car Insurance Quotes

Remember the `CaCarInsuranceQuoteRepository` abstract class that we declared in the previous chapter?

```ts
export interface CarInsuranceQuote {
  id: number;
  ageOfDriver: number;
  monthlyPremium: number;
  yearlyPremium: number;
  createdOn: Date;
}

export abstract class CarInsuranceQuoteRepository {
  public abstract save(
    ageOfDriver: number,
    monthlyPremium: number,
    yearlyPremium: number
  ): Promise<CarInsuranceQuote>;

  public abstract load(id: number): Promise<CarInsuranceQuote>;
}
```

We implemented a Knex specific implementation of this abstract class to be able to save and load quotes to and from our database. Let's make a Prisma version implementation now! Add a file called `prisma-car-insurance-quote.repository.ts` to the folder containing the abstract class. Copy and paste the following code into it:

```ts
import { Injectable } from '@nestjs/common';
import {
  CarInsuranceQuote,
  CarInsuranceQuoteRepository,
} from './car-insurance-quote.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaCarInsuranceQuoteRepository
  implements CarInsuranceQuoteRepository
{
  constructor(private readonly prismaService: PrismaService) {}

  public async save(
    ageOfDriver: number,
    monthlyPremium: number,
    yearlyPremium: number
  ): Promise<CarInsuranceQuote> {
    const createdOn: Date = new Date();
    const quote = await this.prismaService.carInsuranceQuote.create({
      data: {
        ageOfDriver,
        monthlyPremium,
        yearlyPremium,
        createdOn,
      },
    });

    return {
      id: quote.id,
      ageOfDriver: quote.ageOfDriver,
      monthlyPremium: quote.monthlyPremium.toNumber(),
      yearlyPremium: quote.yearlyPremium.toNumber(),
      createdOn: quote.createdOn,
    };
  }

  public async load(id: number): Promise<CarInsuranceQuote | null> {
    const quote = await this.prismaService.carInsuranceQuote.findUnique({
      where: { id },
    });

    return quote
      ? {
          id: quote.id,
          ageOfDriver: quote.ageOfDriver,
          monthlyPremium: quote.monthlyPremium.toNumber(),
          yearlyPremium: quote.yearlyPremium.toNumber(),
          createdOn: quote.createdOn,
        }
      : null;
  }
}
```

The `PrismaService` provider is injected into the `PrismaCarInsuranceQuoteRepository` class. We can use it to send queries to the database.

We need to register this new class in NestJS's dependency injection system. We'll add it to the car insurance quote module, so open the `car-insurance-quote.module.ts` file.

```ts
...
import { PrismaCarInsuranceQuoteRepository } from './repositories/prisma-car-insurance-quote.repository';

@Module({
  controllers: [QuoteController],
  imports: [PrismaModule],
  providers: [
    CarBrandRepository,
    QuoteService,
    /*
    {
      provide: CarInsuranceQuoteRepository,
      useClass: KnexCarInsuranceQuoteRepository
    },
    */
    {
      provide: CarInsuranceQuoteRepository,
      useClass: PrismaCarInsuranceQuoteRepository,
    },
  ],
})
export class CarInsuranceQuoteModule {}
```

Comment out the `KnexCarInsuranceQuoteRepository` provider that provides the `Knex.js` specific implementation. If you want to switch back, uncomment it and remove the `PrismaCarInsuranceQuoteRepository` provider. NestJS will now supply an instance of the `PrismaCarInsuranceQuoteRepository` class whenever we inject the `CarInsuranceQuoteRepository`. You also need to import the `PrismaModule` so that you can inject the `PrismaService` provider!
In the `AppModule` you can now also remove the `KnexModule.forRootAsync(...)` import.

That's all there is to it. When you run the application, saving and loading quotes is handled by Prisma!

## Car Brand Model

Up until now, we've stored the car brands in-memory. Let's open the `car-brand.repository.ts` file and have a look.

```ts
export interface CarBrand {
  id: number;
  name: string;
  minimumDriverAge: number;
  yearlyPremium: number;
}

export class CarBrandRepository {
  private readonly brands: CarBrand[] = [
    { id: 1, name: 'Audi', minimumDriverAge: 18, yearlyPremium: 250 },
    { id: 2, name: 'BMW', minimumDriverAge: 18, yearlyPremium: 150 },
    { id: 3, name: 'Porsche', minimumDriverAge: 25, yearlyPremium: 500 },
  ];

  public findById(id: number): CarBrand | undefined {
    return this.brands.find((brand: CarBrand) => brand.id === id);
  }
}
```

Now that we've got Prisma up and running let's store this data in the database as well. Since we manually maintain the database schema and generate the models using introspection we need to create the database table first. Update the `init.sql` script and add the following DDL to it.

```sql
CREATE TABLE "car_brand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "minimumdriverage" INTEGER NOT NULL,
    "yearlypremium" DECIMAL(12,2) NOT NULL,

    PRIMARY KEY ("id")
);
```

There are two ways to add the new table to the database. If you've already got the PostgreSQL Docker container up and running just use a tool such as [DBeaver](https://dbeaver.io/) to connect to the database and run the script against the `acme` database. Or if you don't mind recreating the database and losing the data within restart the Docker container. To do so, stop the Docker container, remove the postgres volume (e.g. `acme-api_postgres`) and start the container again.

```sh
docker-compose down
docker volume rm acme-api_postgres
docker-compose up -d
```

Now we can introspect the database and generate the Prisma model.

```sh
npx prisma db pull
```

Afterward, the `schema.prisma` file contains `car_brand` model.

```prisma
model car_brand {
  id               Int     @id @default(autoincrement())
  name             String
  minimumdriverage Int
  yearlypremium    Decimal @db.Decimal(12, 2)
}
```

Let's rename the model and fields using the `@map` and `@@map` API attributes.

```prisma
model CarBrand {
  id               Int     @id @default(autoincrement())
  name             String
  minimumDriverAge Int     @map("minimumdriverage")
  yearlyPremium    Decimal @map("yearlypremium") @db.Decimal(12, 2)

  @@map("car_brand")
}
```

We must regenerate the Prisma Client after updating the schema.

```sh
npx prisma generate
```

Let's remove the in-memory implementation of the `CarBrandRepository` class and make it abstract. Replace the code in the `car-brand.repository.ts` file with the following code.

```ts
export interface CarBrand {
  id: number;
  name: string;
  minimumDriverAge: number;
  yearlyPremium: number;
}

export abstract class CarBrandRepository {
  public abstract findById(id: number): Promise<CarBrand | null>;
}
```

We don't persist car brands via the repository. We only need to retrieve one via its ID. Hence, we only require a `findById()` method.

Note that the `findbyId()` method now returns a promise. Update the call to it in the `QuoteService`, be sure to put an `await` in front of it.

```ts
const brand: CarBrand = await this.carBrandRepository.findById(carId);
```

Now we can extend from this abstract class and provide a Prisma-specific implementation. In the same folder as the `car-brand.repository.ts` file add a new file called `prisma-car-brand.repository.ts` file. The implementation is straightforward, the `PrismaService` is injected so that we can use our Prisma Client API to query the car brands from the database.

```ts
import { Injectable } from '@nestjs/common';
import { CarBrand, CarBrandRepository } from './car-brand.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaCarBrandRepository implements CarBrandRepository {
  constructor(private readonly prismaService: PrismaService) {}

  public async findById(id: number): Promise<CarBrand> {
    const brand = await this.prismaService.carBrand.findUnique({
      where: { id },
    });

    return brand
      ? {
          id: brand.id,
          name: brand.name,
          yearlyPremium: brand.yearlyPremium.toNumber(),
          minimumDriverAge: brand.minimumDriverAge,
        }
      : null;
  }
}
```

Last, but not least, we must register this new provider in the `CarInsuranceQuoteModule`

```ts
@Module({
  controllers: [QuoteController],
  imports: [PrismaModule],
  providers: [
    QuoteService,
    {
      provide: CarBrandRepository,
      useClass: PrismaCarBrandRepository,
    },
    {
      provide: CarInsuranceQuoteRepository,
      useClass: PrismaCarInsuranceQuoteRepository,
    },
  ],
})
export class CarInsuranceQuoteModule {}
```

Voila, now when the `QuoteService` asks the `CarBrandRepository` to retrieve a car brand, the Prisma-specific implementation of this abstract class (`PrismaCarBrandRepository`) will happily retrieve it for us.

Restart the application and test it out. Oh, but wait, we don't have any data yet in the `car_brand` table. Let's fix that in the next section.

## Seeding the Database

Using Prisma's integrated [seeding functionality](https://www.prisma.io/docs/guides/database/seed-database) you can seed your database. Let's use it seed the car brands we previously stored in-memory.

Add a `seed.ts` file in the same location as your `schema.prisma` file. In the `seed.ts` file, import the Prisma Client, instantiate it, and create some car brands using the generated Prisma Client API.

```ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.carBrand.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Audi',
      minimumDriverAge: 18,
      yearlyPremium: 250,
    },
  });

  await prisma.carBrand.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'BMW',
      minimumDriverAge: 18,
      yearlyPremium: 150,
    },
  });

  await prisma.carBrand.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Porsche',
      minimumDriverAge: 25,
      yearlyPremium: 500,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Now open the `package.json` of your project and add the following to it:

```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

If you are using ESM (ECMAScript modules):

```json
"prisma": {
  "seed": "node --loader ts-node/esm prisma/seed.ts"
}
```

Normally you already have the required dependencies and, if not install them.

```sh
yarn add -D ts-node typescript @types/node
```

Finally to seed the database, run the following command:

```sh
npx prisma db seed
```

The `car_brand` table should now be populated with a couple of car brands.

## User Model

The last bit of code that uses in-memory data is the `UsersService` in the authentication module.

```ts
import { Injectable } from '@nestjs/common';

export interface User {
  id: number;
  username: string;
  password: string;
}

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    { id: 1, username: 'Bob', password: 'abc123' },
    { id: 2, username: 'Alice', password: 'def456' },
  ];

  public async findByUsername(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }
}
```

Let's move Bob and Alice into our database as well. Remove the `users.service.ts` file from the authentication module. Add a `repositories` folder to the module and add a `user.repository.ts` file to it. This file will contain an abstract `UserRepository` class.

```ts
export interface User {
  id: number;
  username: string;
  hashedPassword: string;
}

export abstract class UserRepository {
  public abstract findByUsername(id: string): Promise<User | null>;
}
```

As with the `CarBrandRepository` we don't persist users but only retrieve them. This time, not via their ID, but via their username which is unique as well. We'll only store the username and a hashed password for each user.

Before creating a Prisma-specific implementation of this repository, let's update our database. Add the following DDL to the `init.sql` file.

```sql
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "hashedpassword" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user.username_unique" ON "user"("username");
```

Manually run this script to add the new `user` table to your database or recreate the Docker container (incl. volume) as explained in the previous section.

Afterward, introspect the database to generate the Prisma schema.

```sh
npx prisma db pull
```

```prisma
model user {
  id             Int    @id @default(autoincrement())
  username       String @unique
  hashedpassword String
}
```

Note the `@unique` API attribute Prisma appended for the username to indicate a unique constraint for the underlying column. Use the `@map` and `@@map` API attributes to rename the model and fields.

```prisma
model User {
  id             Int    @id @default(autoincrement())
  username       String @unique
  hashedPassword String @map("hashedpassword")

  @@map("user")
}
```

After updating the Prisma schema, we must regenerate our Prisma Client.

```sh
npx prisma generate
```

Time to create a Prisma-specific implementation of the `UserRepository`. Add a file called `prisma-user.repository.ts` in the same location as the `user.repository.ts` file.

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserRepository } from './user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  public async findByUsername(username: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: { username },
    });

    return user
      ? {
          id: user.id,
          username: user.username,
          hashedPassword: user.hashedPassword,
        }
      : null;
  }
}
```

Register the `PrismaUserRepository` as a provider in the `AuthenticationModule` (`authentication.module.ts`). We must also import the `PrismaModule` as we inject the `PrismaService` in the `PrismaUserRepository`.

```ts
...
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { UserRepository } from './repositories/user.repository';

@Module({})
export class AuthenticationModule {
  public static register(options: AuthenticationModuleOptions): DynamicModule {
    return {
      module: AuthenticationModule,
      controllers: [...],
      providers: [
        ...
        { provide: UserRepository, useClass: PrismaUserRepository },
      ],
      imports: [
        ...,
        PrismaModule
      ]
    };
  }
}
```

The `AuthenticationService` (`authentication.service.ts`) relies on the `UsersService` we deleted. Now it will use the new `UserRepository` instead to retrieve users via their username. The submitted password will be hashed and compared to the stored hash. To generate the hash we'll use the `bcryptjs` package.

```sh
yarn add bcryptjs
yarn add @types/bcryptjs -D
```

The new implementation looks as follows.

```ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserRepository } from './repositories/user.repository';
import { compare } from 'bcryptjs';

export type AuthenticatedUser = Omit<User, 'hashedPassword'>;

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService
  ) {}

  public async validate(
    username: string,
    password: string
  ): Promise<AuthenticatedUser | null> {
    const user: User = await this.userRepository.findByUsername(username);

    if (user && (await compare(password, user.hashedPassword))) {
      return { id: user.id, username: user.username };
    }

    return null;
  }

  public signin(user: AuthenticatedUser): string {
    const payload = { username: user.username, sub: user.id };
    return this.jwtService.sign(payload);
  }
}
```

The `User` type also slightly changed. The `password` property was renamed to `hashedPassword`. Be sure to ommit it from the `AuthenticatedUser` type as shown above.

Also make sure to import the `PrismaModule` into the authentication module, so that the `PrismaService` provider is available.

```ts
@Module({})
export class AuthenticationModule {
  public static register(options: AuthenticationModuleOptions): DynamicModule {
    return {
      module: AuthenticationModule,
      providers: [...]
      controllers: [...],
      imports: [
        PrismaModule,
        ...
      ],
    };
  }
}
```

We're almost there. Let's seed some user data into our database. Open the `seed.ts` file and add the following code to the `main()` function. I already generated hashes for the passwords for you.

```ts
await prisma.user.upsert({
  where: { id: 1 },
  update: {},
  create: {
    username: 'Bob',
    hashedPassword:
      '$2a$08$hZCfpa2XVRshMkKwPGqnHOFjp9ldeTZWpt5Ph9.MH6Bhquw6i5byi', // abc123
  },
});

await prisma.user.upsert({
  where: { id: 2 },
  update: {},
  create: {
    username: 'Alice',
    hashedPassword:
      '$2a$08$2cF6keVw/M0QAy3f9GWIdO1d9ubns0B19EIKlXSmI62gt474SbNMK', // def456
  },
});
```

Seed the database again to add the users.

```sh
npx prisma db seed
```

Voila, no more in-memory data! The quotes, car brands, and users are now all persisted in the database!

**Remark**: Now that we've fully migrated from [Knex.js](http://knexjs.org/) to [Prisma](http://www.prisma.io) you can remove the Knex dependencies and Knex-specific code. In this demo repository, I'll only comment out the `KnexModule.forRootAsync()` call in the `AppModule` (`app.module.ts`). I'll leave the Knex-specific code and dependencies intact but feel free to remove them in your repository.
