# Add PostgreSQL with Knex

## Prerequisite: Install Docker

Download the installation package for your OS.

* [Docker Desktop for Mac (Apple Chip)](https://desktop.docker.com/mac/stable/arm64/Docker.dmg)
* [Docker Desktop for Mac (Intel Chip)](https://desktop.docker.com/mac/stable/amd64/Docker.dmg)
* [Docker Desktop for Windows](https://desktop.docker.com/win/stable/amd64/Docker)

Docker Desktop includes Docker Compose, so we do not need to install Compose separately. If you installed Docker in another way and don't have Compose yet, please consult the [Install Docker Compose](https://docs.docker.com/compose/install) documentation.

## Running PostgreSQL in a Docker Container

A basic understanding of the Docker CLI and Docker Compose is also a prerequisite.

Add a `docker-comppose.yml` file to the root of the repository and add the following configuration to it.

```yml
version: '3.5'

services:
  postgres:
    container_name: postgres
    image: postgres:13.4-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: acme
      PGDATA: /data/postgres
    volumes:
      - postgres:/data/postgres
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - 5432:5432
    restart: always

volumes:
  postgres:
```

This Compose configuration file points to two environment variables:

* `POSTGRES_USER`: superuser username for PostgreSQL
* `POSTGRES_PASSWORD`: superuser password for PostgreSQL

Be sure to configure these environment variables locally before starting the container. (**Tip**: I use [direnv](https://direnv.net/) to load and unload environment variables depending on the current directory.)

The database name is set to `acme` and there is also a volume which points to an `init.sql` SQL script. Add a new file called `init.sql` to the root of the repository and add the following DDL to it.

```sql
CREATE TABLE IF NOT EXISTS car_insurance_quote (
   id serial PRIMARY KEY,
   ageOfDriver INT NOT NULL,
   monthlyPremium decimal(12,2) NOT NULL,
   yearlyPremium decimal(12,2) NOT NULL,
   createdOn TIMESTAMP NOT NULL
);
```

When you start the Docker Container the first time this `init.sql` script will be executed and a table called `car_insurance_quote` will be created. We will be saving the car insurance quotes in this table later.

Run the following command to run PostgreSQL in a Docker Container:

```sh
docker-compose up -d
```

Verify that PostgreSQL is up and running.

```sh
docker ps
docker-compose logs -f --tail 50 postgres
```

Using a tool such as [DBeaver](https://dbeaver.io/) you can connect to the local PostgreSQL instance and verify that the `acme` database was created and that it contains the `car_insurance_quote` table.

## Introducing Knex

NestJS is database agnostic, allowing you to easily integrate with any SQL or NoSQL database. We can use any `Node.js` database library or ORM such as [Sequelize](https://sequelize.org/), [Prisma](https://www.prisma.io/), [Knex.js](http://knexjs.org/)...etc. For this course, we'll be using `Knex.js`, which is a SQL query builder with support for `PostgreSQL`, `MSSQL`, `MySQL`, `MariaDB`, `SQLite3`, `Oracle` and `Amazon Redshift`. As you might have guessed from the title of the chapter we'll be using [PostgreSQL](https://www.postgresql.org/) as a database.

To work with `Knex.js` and `PostgreSQL` we need to install a few packages.

```ts
 yarn add pg knex nestjs-knex
 ```

 **Remark**: The [nestjs-knex](https://github.com/svtslv/nestjs-knex) package is not an official NestJS package, but it suffices to integrate Knex with our NestJS application for this course. In a real-world application, you might want to write your own NestJS package to integrate Knex. This package is not frequently updated, making it troublesome to update `Knex.js`.

 After installing the `nestjs-knex` package we need to import it into our application's root module. Open the `app.module.file` and modify it as listed below.

 ```ts
import { Module } from '@nestjs/common';
...
import { KnexModule } from 'nestjs-knex';

@Module({
  imports: [
    ...
    KnexModule.forRootAsync({
      useFactory: () => ({
        config: {
          client: 'pg',
          connection: {
            host: process.env.POSTGRES_HOST,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            database: 'acme',
          },
        },
      }),
    }),
  ],
  providers: [...]
})
export class AppModule {}
```

 We reuse the `POSTGRES_USER` and `POSTGRES_PASSWORD` environment variables we declared earlier and add a new one named `POSTGRES_HOST`. Add this new environment variable and point it to the host where the PostgreSQL database is running. In our current setup, this is `localhost`.

## Persisting the Car Insurance Quotes

Now that the PostgreSQL database is up and running and `Knex.js` has been introduced into the codebase we can finally persist the car insurance quotes. Add a new file called `car-insurance-quote.repository.ts` to the `repositories/` folder of the car insurance quote module and add the following code to it.

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
    yearlyPremium: number,
  ): Promise<CarInsuranceQuote>;

  public abstract load(id: number): Promise<CarInsuranceQuote>;
}
```

We declare a simple repository contract using an abstract class. A cool feature of TypeScript is that you can also implement abstract classes, you are not limited to only implementing interfaces. TypeScript can extract the interface from the abstract class. The repository allows us to save and load car insurance quotes. 

Let's implement a Knex specific implementation of this abstract class. Add a file called `knex-car-insurance-quote.repository.ts` to the folder containing the abstract class. It contains the following code:

```ts
import { Injectable } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { CarInsuranceQuote, CarInsuranceQuoteRepository } from './car-insurance-quote.repository';

@Injectable()
export class KnexCarInsuranceQuoteRepository
  implements CarInsuranceQuoteRepository
{
  private table = 'car_insurance_quote';

  constructor(@InjectKnex() private readonly knex: Knex) {}

  public async save(
    ageOfDriver: number,
    monthlyPremium: number,
    yearlyPremium: number,
  ): Promise<CarInsuranceQuote> {
    const createdOn: Date = new Date();
    const result = await this.knex.table(this.table).insert(
      {
        ageofdriver: ageOfDriver,
        monthlypremium: monthlyPremium,
        yearlypremium: yearlyPremium,
        createdon: createdOn,
      },
      'id',
    );

    return {
      id: result[0],
      ageOfDriver,
      monthlyPremium,
      yearlyPremium,
      createdOn,
    };
  }

  public async load(id: number): Promise<CarInsuranceQuote> {
    const row = await this.knex
      .table(this.table)
      .where('id', id)
      .select<CarInsuranceQuote>(
        'id',
        'ageofdriver as ageOfDriver',
        'monthlypremium as monthlyPremium',
        'yearlypremium as yearlyPremium',
        'createdon as createdOn',
      )
      .first<CarInsuranceQuote>();

    return row
      ? {
          id: row.id,
          ageOfDriver: row.ageOfDriver,
          // TODO: use node-pg-types to configure parsers to convert PostgreSQL types back into JavaScript types.
          monthlyPremium: parseFloat(row.monthlyPremium as any),
          yearlyPremium: parseFloat(row.yearlyPremium as any),
          createdOn: row.createdOn,
        }
      : undefined;
  }
}
```

Via the `@InjectKnex()` decorator provided by the `nestjs-knex` package we inject a `Knex` instance that allows us to work with the database via `Knex.js`. The implementation for the `save()` and `load()` methods use this instance to persist and retrieve the car insurance quotes.

Now that we provided an implementation for the abstract `CarInsuranceQuoteRepository` class we need to register it in NestJS's dependency injection system. We are going to register it in the car insurance quote module, so open the `car-insurance-quote.module.ts` file. We need to add a provider that instructs NestJS to supply an instance of the `KnexCarInsuranceQuoteRepository` class whenever a `CarInsuranceQuoteRepository` is injected.

```ts
@Module({
  controllers: [QuoteController],
  providers: [
    CarBrandRepository,
    QuoteService,
    {
      provide: CarInsuranceQuoteRepository,
      useClass: KnexCarInsuranceQuoteRepository,
    },
  ],
})
export class CarInsuranceQuoteModule {}
```

We are almost there. The only thing left to do is to update the quote service (`quote.service.ts`) to use the new repository to save and load the quotes.

First, inject the repository via the service's constructor.

```ts
import { CarBrand, CarBrandRepository, CarInsuranceQuoteRepository } from './repositories';

@Injectable()
export class QuoteService {
  constructor(
    private readonly carBrandRepository: CarBrandRepository,
    private readonly quoteRepository: CarInsuranceQuoteRepository,
  ) {}

  ...
}
```

Then modify the `getById()` method to load quotes via the repository.

```ts
@Injectable()
export class QuoteService {
  ...

  public async getById(id: number): Promise<Premium | undefined> {
    const quote = await this.quoteRepository.load(id);

    return quote
      ? {
          id: quote.id,
          monthlyPremium: quote.monthlyPremium,
          yearlyPremium: quote.yearlyPremium,
        }
      : undefined;
  }
}
```

And finally, update the `calculatePremium()` method to persist the quotes. You can remove the private `premiums` variable as we no longer store the premiums in-memory. 

```ts
@Injectable()
export class QuoteService {
  ...
  public async calculatePremium(
    ageOfDriver: number,
    carId: number,
    purchasePrice: number,
  ): Promise<Premium> {
    ...

    const premium = await this.quoteRepository.save(
      ageOfDriver,
      Math.round(brand.yearlyPremium / 12),
      brand.yearlyPremium,
    );

    return {
      id: premium.id,
      monthlyPremium: premium.monthlyPremium,
      yearlyPremium: premium.yearlyPremium,
    };
  }
}
```

Voila, the quotes are now persisted in the database. Start the application, open a browser and navigate to http://localhost:3000/api and use the Swagger UI to test it. Yay, the car insurance quotes are now persisted in a database!
