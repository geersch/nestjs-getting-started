# Exception Filters

## What is an Exception Filter?

NestJS has a built-in exceptions layer that is responsible for dealing with all unhandled exceptions across an application. For example, if we throw an error from our quote service it will bubble up until the exception layer catches it. It is then translated to a user-friendly response.

Out-of-the-box, this is performed by a build-in **global** exception filter, which handles exceptions of type `HttpException` (incl. subclasses of it). Exceptions which NestJS does not recognize (!= `HttpException`) result in a `500 Internal server error` response. This explains the errors that we noticed in the previous chapter.

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

We can write our own exception filters to deal with these exceptions. These custom exception filters can be configured in our NestJS application to deal with these errors. We can then translate them into a friendlier response.

## Catching Custom Exceptions with Filters

Do you remember the `BusinessRuleViolation` error from the previous chapter?

```ts
export class BusinessRuleViolation extends Error {}
```

It serves as a base class from which all errors that encapsulate business rule violations extend, such as:

- `DriveTooYoungError`
- `PurchasePriceTooLowError`
- `RiskTooHighError`
- ...

If we write an exception filter that handles `BusinessRuleViolation` and its subclasses, then we can catch these exceptions before they bubble up to the global exception filter. We can translate them into a more appropriate response.

Let's create a new filter via the CLI.

```sh
nest g f BusinessRuleViolation --no-spec
```

This creates a `business-rule-violation.filter.ts` in the `src/` folder.

```ts
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch()
export class BusinessRuleViolationFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {}
}
```

In the `@Catch` decorator we must specify which type of error (and its subclasses) we want to catch with the exception filter. Be aware, that you **cannot** specify an abstract constructor, so you cannot declare the `BusinessRuleViolation` as abstract.

Specify the `BusinessRuleViolation` as the parameter for the `@Catch()` decorator and for the generic parameter (`<T>`) of the exception filter.

```ts
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { BusinessRuleViolation } from './car-insurance-quote/errors';

@Catch(BusinessRuleViolation)
export class BusinessRuleViolationFilter<BusinessRuleViolation>
  implements ExceptionFilter
{
  catch(exception: BusinessRuleViolation, host: ArgumentsHost) {
    ...
  }
}
```

The only thing left is to implement the catch method. We are going to keep it simple and translate the exception into a `409 Conflict` response. The body will include the type of exception that was thrown. In a more real-world example, you could for example, also localize a custom error message and return it as well.

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { BusinessRuleViolation } from './car-insurance-quote/errors';

@Catch(BusinessRuleViolation)
export class BusinessRuleViolationFilter<BusinessRuleViolation>
  implements ExceptionFilter
{
  catch(exception: BusinessRuleViolation, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.CONFLICT).json({
      message: 'Business rule violation',
      errors: [
        {
          name: exception.constructor.name,
        },
      ],
    });
  }
}
```

## Binding Filters

Now that we have a custom exception filter, the last thing we need to do is to configure it in our NestJS application. Open the file containing the root application module `app.module.ts`.

One way to set up a filter is by configuring it as a provider with the `APP_FILTER` token imported from the `@nestjs/core` package. It is possible to configure multiple exception filters.

```ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { BusinessRuleViolationFilter } from './business-rule-violation.filter';

@Module({
  imports: [...]
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: BusinessRuleViolationFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AnotherExceptionFilter,
    },
    ...
  ],
})
export class AppModule {}
```

Another way is to use the `useGlobalFilters()` method available on the NestJS application instance (`INestApplication`). If you want to use this instead, then open the application's entry file `main.ts`.

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new BusinessRuleViolationFilter());
  ...
  await app.listen(3000);
}
bootstrap();
```

Let's start the application, open a browser and navigate to http://localhost:3000/api. Sign in with one of the users, authorize once you have obtained a JWT token, and calculate a car insurance quote again. Be sure to fill in a value that violates one of the rules. For example, the age of the driver is less than 18. If you then fire the request you'll get a `409 Conflict` response.

```json
{
  "message": "Business rule violation",
  "errors": [
    {
      "name": "DriveTooYoungError"
    }
  ]
}
```

You can tweak your exception filter and include additional information which may be useful for the client of the API. Using the returned status code and response body the clients can generate a meaningful error message.
