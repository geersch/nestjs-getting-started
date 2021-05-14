# Pipes: Validations & Transformations

## What are Pipes?

Always validate the data sent into the API! NestJS provides pipes to automatically validate incoming requests. A pipe is a class annotated with the `@Injectable()` decorator and they implement the `PipeTransform` interface. The `@Injectable()` decorator marks a class as a provider in NestJS's dependency injection system. NestJS's dependency injection system it out-of-scope for this course, we can fill an entire new course with that topic. But now and then we'll encounter it throughout this course. For now it suffices to know that providers must be marked with the `@Injectable()` decorator and that they are singletons scoped to their containing module by default.

Pipes are used to validate and transform data.

* **validation**: evaluate input data and if valid, pass it through unchanged; otherwise, throw an exception
* **transformation**: transform the input to the desired type (e.g. converting a string into a number)

Pipes operate on the `arguments` being processed by a controller method or `controller route handler`. The pipes are executed just before the route handler is invoked and they receive the arguments that will eventually be passed to it. If the pipe transforms the `arguments` then they are passed passed to the route handler as such.

NestJS comes out of the box with several pipes, which are part of the `@nestjs/common` package.

| File  | Purpose |
| ------------- | ------------- |
| `ValidationPipe`  | Uses the [class-validator](https://github.com/typestack/class-validator) package to support validation decorators to validate incoming payloads. The rules are declared with decorators on simple classes (DTOs).  |
| `ParseIntPipe`  | Transforms a parameter to a JavaScript number or throws an exception on failure. |
| `ParseBoolPipe`  | Transforms a parameter to a JavaScript boolean or throws an exception on failure. |
| `ParseArrayPipe`  | Transforms a string into an array of a certain type, using a specified separator. |
| `ParseUUIDPipe`  | Validates if a string parameter is a valid UUID. |

The `ValidationPipe` allows you to validate incoming payloads using a declarative syntax (decorators), while the other pipes (`ParseIntPipe`, `ParseBoolPipe`...) usually transform (or validate) an parameter of a certain type to another type.

## Validate the Car Insurance Quote Payload

To calculate a car insurance quote we require # input parameters.

* age of the driver
* brand of the car (BMW, Skoda, Mini, Tesla, Porsche...)
* purchase price of the car

Let's declare a simple class to contain the incoming data. We also refer to these classes as data transfer objects (DTO) as they contain data that was tranferred over the wire. These classes are simple and do not contain any logic, only data.

Create a new folder called `dtos` inside of the `car-insurance-quote` folder and add a file called `calculate-quote-request.dto.ts` to it. 

```sh
mkdir dtos
touch calculate-quote-request.dto.ts
```

Before we continue we must install a couple of packages:

* [class-validator](https://github.com/typestack/class-validator): provides us with decorator-based validatoin for the incoming payloads.
* [class-transformer](https://github.com/typestack/class-transformer): provides us with decorator-based transformation for the incoming payloads.

```sh
yarn add class-validator class-transformer
```

Let's declare a class for the DTO. For the age of the driver, car ID and the purchase price we expect a valid number to be submitted. We assume the car brand is specified by submitting the ID of the selected brand.

```ts
import { IsNumber } from 'class-validator';

export class CalculateQuoteRequestDto {
  @IsNumber()
  ageOfDriver: number;

  @IsNumber()
  carId: number;

  @IsNumber()
  purchasePrice: number;
}
```

Using the decorators provided by the `class-validator` package we can validate the incoming data by applying decorators to the properties of our DTO .

Let's bind the incomiong request payload to our DTO and make sure the validation is executed.

```ts
@Post('calculate')
public async post(@Body() quote: CalculateQuoteRequestDto): Promise<any> {
  ...
}
```

Using the `@Body()` decorator provided by the `@nestjs/common` package we can extract the body of the request and bind it to our DTO. If you now make a request without a body you'll notice that it will not validate the incoming request pay load yet. We need to invoke the `ValidationPipe`. We need to setup the pipe globally first.

Open the `main.ts` file and register the `ValidationPipe`.

```ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
```

If you send a request with an empty payload now the server will responsd with a `400 Bad Request` statuscode and the response includes an object with detailled information about the validation errors that were detected. This way the client of the API can correct its mistakes and try again.

```sh
curl --location --request POST 'http://localhost:3000/api/quote/calculate'
```

```json
{
    "statusCode": 400,
    "message": [
        "ageOfDriver must be a number conforming to the specified constraints",
        "carId must be a number conforming to the specified constraints",
        "purchasePrice must be a number conforming to the specified constraints"
    ],
    "error": "Bad Request"
}
```

Let's correct the request.

```
curl --location --request POST 'http://localhost:3000/api/quote/calculate' \
--header 'Content-Type: application/json' \
--data-raw '{
    "ageOfDriver": 18,
    "carId": "0B66C9BC-C1CD-488D-93EA-237C9CA6DCCC",
    "purchasePrice": 35000
}'
hello, world!%
```

Voila, no more `400 Bad Request` response. Our request passes validation and is processed.

You can even write your own custom validation decorators. For example, here's a validator which checks if two properties on the DTO are equal. 

```ts
import { 
    registerDecorator, 
    ValidationArguments, 
    ValidationOptions 
} from 'class-validator';

export function IsEqualTo(property: string, validationOptions?: ValidationOptions) {
    return (object: any, propertyName: string) => {
      registerDecorator({
        name: 'isEqualTo',
        target: object.constructor,
        propertyName,
        constraints: [property],
        options: validationOptions,
        validator: {
          validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value === relatedValue;
        },

        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `$property must match ${relatedPropertyName} exactly`;
        },
      },
    });
  };
}
```

Handy if you want to compare passwords.

```ts
export class ChangePasswordRequestDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'password too weak' })
  password: number;

  @IsEqualTo('password')
  passwordConfirm: string;
}
```

## Transforming the Payload

When a car insurance quote is submitted we persist it and assign a unique ID to it. Later we can use that ID to retrieve the car insurance quote via a separate route handler. Let's add that handler now.

We also use DTOs to return responses. Let's declare a DTO to contain the response. Add a new file called `car-insurance-quote.response.dto` to the `dtos` folder and add the following code to it.

```ts
export class CarInsuranceQuoteResponseDto {
  monthlyPrice: number;
  yearlyPrice: number;
}
```

Now we can add a new route handler to our controller to retrieve the details of a car insurance quote. For now we just return a hardcoded response. Later in the course, we will retrieve the quote from a database.

We want to retrieve a quote by specifying its ID as part of the request (`GET /api/quote/1`). We can add a router parameter token in the path of the route to capture this dynamic value. The route parameter below in the `@Get()` decorator illustrates how to declare this.

By default any route parameters are passed as strings to the server. We want to convert this string into a number. Using the `@Param()` decorator we can pluck the dynamic value from the request. We can pass an optional array of pipes through which the extract value will be passed. In this case we only want to pass the value through the `ParseIntPipe` which transform the string into a number. If it fails, the pipe will throw an exception which in turn leads to `400 Bad Request` response code. 

```ts
@Get(':id')
public async getById(
  @Param('id', ParseIntPipe) id: number,
): Promise<CarInsuranceQuoteResponseDto> {
  console.log(typeof id);

  return {
    monthlyPrice: 10,
    yearlyPrice: 120,
  };
}
```

If we pass an invalid value as the route parameter, we'll get a `400 Bad Request` response code.

```sh
❯ curl --location --request GET 'http://localhost:3000/api/quote/foo'
{"statusCode":400,"message":"Validation failed (numeric string is expected)","error":"Bad Request"}%
```

If we pass a valid value it will return a `200 OK` response code and the hardcoded quote as the payload.

```sh
❯ curl --location --request GET 'http://localhost:3000/api/quote/1'
{"monthlyPrice":10,"yearlyPrice":120}%
```

You'll notice that the output of `console.log(typeof id)` is `number` indicating the `ParseIntPipe` successfully transformed the route parameter.
