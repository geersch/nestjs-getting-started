# Interceptors

## What are Interceptors?

Interceptors are a concept which NestJS borrowed from [Aspect Oriented Programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming) (AOP). Interceptors enable you to attach additional logic before and after a method is executed.

With interceptors, you have the capability to:

- Modify the result returned from a function
- Cache (memoize) the result returned from a function
- Retry a function in case of a failure
- ...and more.

When a request is made, NestJS follows a specific order of operations to handle that request. First, any middleware that has been configured is executed, both at the global level and within the relevant module. Next, any guards are executed to check for authorization or other requirements. Then, any interceptors that have been defined are executed.


However, there is an exception to the order of execution when it comes to interceptors. Specifically, interceptors are also executed after the request has been handled but just before the response is returned. The interceptors return observables from the [RxJS](https://rxjs.dev/) library, which are resolved just before the exception filters and before the response is returned from the server.

To summarize, the request lifecycle in NestJS follows this order:

1. Incoming request
2. Middleware (global and module-bound)
3. Guards
4. Interceptors
5. Controller handling
7. Global interceptors (post-controller)
8. Exception filters
9. Response sent

## Configuring an Interceptor

One way to configure an interceptor is by using the `@UseInterceptors()` decorator.

```ts
@UseInterceptors(LoggingInterceptor)
export class QuoteController {}
```

You can either pass the interceptor class or an instance of it.

```ts
@UseInterceptors(new LoggingInterceptor())
export class QuoteController {}
```

You can also apply the decorator to a specific controller method. 

```ts
export class QuoteController {

  @UseInterceptors(LoggingInterceptor)
  public async post(
    @Body() quote: CalculateQuoteRequestDto,
  ): Promise<CarInsuranceQuoteResponseDto> {
    ...
  }
}
```

Finally, you can configure an interceptor globally for your entire application by registering it as a provider in your `AppModule` and using the `APP_INTERCEPTOR` token:

```ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

## Custom Interceptor


To create a custom interceptor in NestJS, you need to implement the `NestInterceptor` interface. This interface only has one method, `intercept`, which takes two parameters: the `ExecutionContext` instance and a `CallHandler`. The `ExecutionContext` is a wrapper around the arguments passed to the original handler, while the `CallHandler` is used to invoke the route handler method in your interceptor. If you don't call the `handle()` method, the route handler method won't be executed.


```ts
export interface NestInterceptor<T = any, R = any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<R> | Promise<Observable<R>>;
}
```

Interceptors, like controllers, providers, guards, and so on, can inject dependencies through their constructor.

Here's an example of a custom interceptor that uses the [@geersch/retry](https://github.com/geersch/retry) package to retry failed operations with an exponential backoff strategy:

```ts
export class RetryInterceptor implements NestInterceptor {
  private readonly backoffStrategy: Type<BackoffStrategy> | BackoffStrategy;

  constructor(
    @Optional() backoffStrategy: Type<BackoffStrategy> | BackoffStrategy = EqualJitterBackoffStrategy,
    @Optional() private readonly retryOptions: RetryOptions = {},
  ) {
    this.backoffStrategy = backoffStrategy;
  }

  intercept(context: ExecutionContext, next: CallHandler) {
    let attempt = 1;

    this.setRetryAttemptHeader(context, attempt);

    return passRetryOperatorToPipe(
      next.handle().pipe(
        tap({
          error: () => {
            attempt += 1;
            this.setRetryAttemptHeader(context, attempt);
          },
        }),
      ),
      this.backoffStrategy,
      this.retryOptions,
    );
  }

  private setRetryAttemptHeader(context: ExecutionContext, attempt: number): void {
    if (context.getType() === 'http') {
      const httpContext = context.switchToHttp();
      const req = httpContext.getRequest();
      req.headers['x-attempt'] = attempt;
    }
  }
}
```

In the example above, the `RetryInterceptor` class implements the `NestInterceptor` interface. It injects an optional `BackoffStrategy` and `RetryOptions` into its constructor, allowing you to customize the backoff strategy and retry options. In the intercept method, it sets the `x-attempt` header and uses the `passRetryOperatorToPipe method` (from `@geersch/retry`) to retry the operation with the specified backoff strategy.

To apply this interceptor to a controller method, you can use the `@UseInterceptors` decorator and pass an instance of the `RetryInterceptor` class with the desired backoff strategy:

```ts
export class QuoteController {

  @UseInterceptors(
    new RetryInterceptor(DecorrelatedJitterBackoffStrategy)
  )
  public async post(
    @Body() quote: CalculateQuoteRequestDto,
  ): Promise<CarInsuranceQuoteResponseDto> {
    ...
  }
}
```

With this configuration, the post method will be retried automatically using the specified backoff strategy.
