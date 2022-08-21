# Middleware

## What is Middleware?

Middleware is nothing more than a function that is invoked **before** a route handler is executed. A middleware function always has access to the `request`, `response` objects, and the `next` middleware function in the application's request-response cycle. When the `next` function is invoked, it executes the middleware function that is configured to follow the current middleware. If the `next` function is **not** invoked the request will hang. You must invoke it to pass control to the next middleware function. If you do not pass control, then you must [end the request-response cycle](http://expressjs.com/en/api.html#res.end) by invoking an appropriate method on the `response` object (e.g. `res.end()`, `res.status(404).end()`...).

```ts
import { Request, Response, NextFunction } from 'express';

export function requireJsonContentType(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // The req argument represents the HTTP request.
  // The res argument represents the HTTP response.
  // The next argument is the next middleware function in the application's request-response cycle.

  const contentType = req.headers['content-type'];
  if (contentType !== 'application/json') {
    // Prematurely end the request-response-cycle.
    res.status(400).send('Content-Type application/json is required.');
    return;
  }

  // Invoke the next middleware.
  next();
}
```

If you are using `ExpressJS` as the underlying HTTP framework you can import the `Request`, `Response`, and `NextFunction` type declarations from Express (`@types/express`) when creating middleware and use them to denote the types of the arguments of the middleware.

The full syntax for middleware `middleware(err, req, res, next)`, includes an extra argument to deal with error handling. Normally you configure such a middleware function last. However, as we've seen in the previous chapter NestJS provides a global exception filter for this purpose. You don't need to use this type of middleware.

`Fastify` v3.0.0 does not support middleware out-of-the-box. It requires an external plugin such as [fastify-express](https://github.com/fastify/fastify-express) or [middie](https://github.com/fastify/middie). The syntax style is the same as ExpressJS / Connect. Methods added by Express to the enhanced version of `req` and `res` are not supported in Fastify middlewares. `Fastify` also does **not** support the full syntax.

The above middleware example is referred to as **functional middleware** in NestJS parlance. It's just a simple function. However, we cannot leverage NestJS's dependency injection system in functional middleware. We cannot inject dependencies into functional middleware. Luckily, NestJS also allows us to write class-based middleware. Let's transform the previous example into class-based middleware.

Using the CLI scaffold a new middleware class.

```sh
nest g mi RequireJsonContentType --no-spec
```

This will add a file called `require-json-content-type.middleware.ts` in the `src/` folder.

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class RequireJsonContentTypeMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    next();
  }
}
```

Let's provide some typings. The `ExpressJS` type declarations (`@types/express`) were installed when we generated a new NestJS project using the CLI at the start of the course.

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequireJsonContentTypeMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: NextFunction): void {
    next();
  }
}
```

We can port the remainder of the original middleware function as is.

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequireJsonContentTypeMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: NextFunction): void {
    const contentType = req.headers['content-type'];
    if (contentType !== 'application/json') {
      res.status(400).send('Content-Type application/json is required.');
      return;
    }
    next();
  }
}
```

At the moment we are not injecting any dependencies into the middleware. Let's refactor the middleware a bit and inject the content type that we want it to require. Rename the file to `require-content-type.middleware.ts` and modify the code as follows:

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export class ContentTypeMiddlewareConfiguration {
  requiredContentType: string;
}

@Injectable()
export class RequireContentTypeMiddleware implements NestMiddleware {
  constructor(private readonly config: ContentTypeMiddlewareConfiguration) {}

  public use(req: Request, res: Response, next: NextFunction): void {
    const contentType = req.headers['content-type'];
    if (contentType !== this.config.requiredContentType) {
      res
        .status(400)
        .send(`Content-Type ${this.config.requiredContentType} is required.`);
      return;
    }
    next();
  }
}
```

The middleware is now more generic and allows us to configure the content type that is required for incoming requests. A `ContentTypeMiddlewareConfiguration` instance is injected through the constructor via which the required content type of the incoming requests can be specified.

Let's see how we can configure the middleware in the next section.

## Configuring Middleware

Open the application root module (`app.module.ts`). The `AppModule` must now implement the `NestModule` interface from the `@nestjs/common` module.

```ts
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
...
import {
  ContentTypeMiddlewareConfiguration,
  RequireContentTypeMiddleware,
} from './require-content-type.middleware';

@Module({
  imports: [...]
  providers: [
    ...

    // Provide the configuration to be injected into the middleware.
    {
      provide: ContentTypeMiddlewareConfiguration,
      useValue: { requiredContentType: 'application/json' }
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) { ... }
}
```

The `NestModule` requires us to implement one method called `configure()`.

```ts
export interface NestModule {
  configure(consumer: MiddlewareConsumer): any;
}
```

Middleware is not configured via the `@Module()` decorator but is configured via the `MiddlewareConsumer` instance provided to the `configure()` method as its only argument. NestJS call the `configure()` method of the module during the app life cycle when it loads the modules. Also, note that an extra provider was configured in the `AppModule` so that NestJS can inject the configuration into the middleware.

Using the `MiddlewareConsumer` instance we can now configure the middleware. Let's configure the middleware to be configured for all requests, no matter by which HTTP method (`GET`, `POST`...) they are invoked.

```ts
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
...
import {
  ContentTypeMiddlewareConfiguration,
  RequireContentTypeMiddleware,
} from './require-content-type.middleware';

@Module({ ... })
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequireContentTypeMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
```

Make sure to recompile the application and head on over to the Swagger UI to test the middleware. Signing in and calculating a quote works as before, but when you retrieve a car quote you'll receive a `400 Bad Request` response with the message `Content-Type application/json is required.`. Our middleware is now up and running.

You can configure the paths to which the middleware will be applied via the `forRoutes()` method in a couple of ways.

- `forRoutes('quote')`: Set up the middleware for the `/quote` route handlers that are defined in the `QuoteController`.
- `forRoutes({ path: '*', method: RequestMethod.ALL })`: Using the `*` wildcard set up the middleware for all route handlers of the application. With the `method` property you can specify for which HTTP methods ( `GET`, `POST`...) the middleware should be applied. You can use other wildcards such as `?`, `+`, `*` and `()`. Hyphens (`-`) and dots (`.`) are interpreted as literal characters.

You can also exclude routes to make sure that the middleware is not applied to them.

```ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequireContentTypeMiddleware)
      .exclude(...)
      .forRoutes(...);
  }
}
```

Although configuring excluded routes is **not** intuitive. A better alternative would be to implement path-restriction logic directly into the middleware or configure it as separate middleware.

The following thread on NestJS's GitHub account dives deeper into this topic:

https://github.com/nestjs/nest/issues/853

It does not matter if the middleware is class-based or functional. Both can be configured in the same fashion. Consider the functional middleware we created earlier.

```ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(requireJsonContentType())
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
```

You can also configure multiple middlewares to be executed sequentially, simply by passing them to the `apply()` method.

```ts
consumer
  .apply(
    RequireContentTypeMiddleware,
    LoggerMiddleWare,
    myFunctionalMiddleware()
  )
  .forRoutes({ path: '*', method: RequestMethod.ALL });
```

As a final step let's remove the middleware that we just configured. We don't require it for the car insurance quote application.

## ExpressJS Middleware

The last option to configure middleware is to configure it as global middleware in the application's entry file (`main.ts`). However, with this option, you can only use **functional** middleware! You don't have access to NestJS's dependency injection system for global middleware. `INestApplication.use()` requires a middleware function and does not work with class-based middleware. Functional middleware is compatible with ExpressJS / Connect style middleware. This means that you can just load existing ExpressJS middleware. Let's configure the [compression](http://expressjs.com/en/resources/middleware/compression.html) middleware for our application to compress the HTTP responses.

Install the required dependencies.

```sh
yarn add compression
```

And configure the global (functional) middleware.

```ts
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  ...
  app.use(compression());
  ...
  await app.listen(3000);
}
bootstrap();
```

You can consult the [ExpressJS middleware](https://expressjs.com/en/resources/middleware.html) documentation for a list of middleware modules maintained by the ExpressJS team.
