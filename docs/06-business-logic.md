# Business Logic

## The Rules

Before we can continue with demonstrating other NestJS building blocks we must implement a little bit of business logic. Let's implement a service for the car insurance quote module to calculate the premium for a quote. Let's refresh the business rules.

To calculate a car insurance quote we require 3 input parameters.

* age of the driver
* brand of the car (BMW, Skoda, Mini, Tesla, Porsche...)
* purchase price of the car

Some business rules apply.

- the minimum age of the driver is 18
- the value of the car must be 5.000 € or greater
- the minimum age of the driver can be different per car (e.g. car insurance is not provided for drivers younger than 25 for a Porsche)

Let's keep the rest simple and let's assume that the price of the car insurance is a fixed price per car brand. We should return a response that includes the yearly and monthly (yearly / 12) premiums.

* `BMW`: 150 € / year
* `Skoda`: 100  €  / year
* `Mini`: 150  € / year
* `Tesla`: 250  € / year
* `Porsche`: 500  € / year
( ...etc.)

## Quote Service

Let's start by adding a quote service to the car insurance quote module.

```sh
nest g s quote car-insurance-quote --no-spec --flat
```

At the moment we don't have a database yet, we'll get to that in a later module. For now, we'll still store our data in memory. Let's create a simple in-memory repository to store information about the car brands. Add a new folder called `repositories` to the car insurance quote module and add a file called `car-brand.repository.ts` to it. Add the following code to it:

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

Configure the `CarBrandRepository` as a provider in the car insurance quote module so that we can inject it into the quote service.

```ts
import { Module } from '@nestjs/common';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import { CarBrandRepository } from './repositories';

@Module({
  controllers: [QuoteController],
  providers: [CarBrandRepository, QuoteService],
})
export class CarInsuranceQuoteModule {}
```

The business rules imply that there are certain use cases in which we cannot calculate a quote (driver too young, purchase price too low...). Let's define some error classes for these situations. Create a new folder called `errors` to the car insurance quote module. Add the following files to the folder:

`busisness-rule-validation.error.ts`

A base class from which all errors that encapsulate business rule violations extend.

```ts
export class BusinessRuleViolation extends Error {}
````

`driver-too-young.error.ts`

The error is thrown if the driver is too young to be insured.

```ts
import { BusinessRuleViolation } from './busisness-rule-validation.error';

export class DriveTooYoungError extends BusinessRuleViolation {}
```

`purchase-price-too-low.error.ts`

The error is thrown if the purchase price of the car is too low.

```ts
import { BusinessRuleViolation } from './busisness-rule-validation.error';

export class PurchasePriceTooLowError extends BusinessRuleViolation {}
```

`risk-too-high.error.ts`

The error is thrown if the risk is too high to ensure (e.g. driver too young for a particular brand).

```ts
import { BusinessRuleViolation } from './busisness-rule-validation.error';

export class RiskTooHighError extends BusinessRuleViolation {}
```

`unknown-car-brand.error.ts`

The error is thrown if an unknown car brand is specified.

```ts
import { BusinessRuleViolation } from './busisness-rule-validation.error';

export class UnknownCarBrandError extends BusinessRuleViolation {}
```

Now let's implement our quote service. The code is straightforward. We inject the `CarBrandRepository` via the constructor and add a method called `calculatePremium()`. This method receives three parameters:

* age of the driver
* ID of the car brand
* purchase price of the car

The method verifies the business rules and throws one of the errors we created earlier if one of them is violated. If the validation succeeds, then a premium is calculated and stored in memory. Calculated premiums can later be retrieved via the `findById()` method.

```ts
import { Injectable } from '@nestjs/common';
import {
  DriveTooYoungError,
  PurchasePriceTooLowError,
  RiskTooHighError,
  UnknownCarBrandError,
} from './errors';
import { CarBrand, CarBrandRepository } from './repositories';

export interface Premium {
  id: number;
  monthlyPremium: number;
  yearlyPremium: number;
}

const MINIMUM_AGE = 18;
const MINIMUM_PURCHASE_PRICE = 5000;

@Injectable()
export class QuoteService {
  private readonly premiums: Premium[] = [];

  constructor(private readonly carBrandRepository: CarBrandRepository) {}

  public async calculatePremium(
    ageOfDriver: number,
    carId: number,
    purchasePrice: number,
  ): Promise<Premium> {
    if (ageOfDriver < MINIMUM_AGE) {
      throw new DriveTooYoungError();
    }

    if (purchasePrice < MINIMUM_PURCHASE_PRICE) {
      throw new PurchasePriceTooLowError();
    }

    const brand: CarBrand = this.carBrandRepository.findById(carId);
    if (!brand) {
      throw new UnknownCarBrandError();
    }

    if (ageOfDriver < brand.minimumDriverAge) {
      throw new RiskTooHighError();
    }

    const premium = {
      id: this.premiums.length + 1,
      monthlyPremium: Math.round(brand.yearlyPremium / 12),
      yearlyPremium: brand.yearlyPremium,
    };

    this.premiums.push(premium);

    return premium;
  }

  public async getById(id: number): Promise<Premium | undefined> {
    return this.premiums.find((premium) => premium.id === id);
  }
}
```

**Remark**: This course is not about writing business logic. In a real-world application, you would tackle this differently. Perhaps the domain is complex enough to warrant applying domain-driven design (DDD). In that case, you could model the domain, introduce entities, value objects, aggregates...etc. For our purpose, we want a simple solution that does not distract us from the main goal of the course.

The last thing we need to do is to inject the quote service in the controller and update the route handlers.

```ts
@ApiTags('car insurance quotes')
@Controller('quote')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @ApiCreatedResponse({
    description: 'The car insurance quote has been successfully created.',
  })
  @Post('calculate')
  public async post(
    @Body() quote: CalculateQuoteRequestDto,
  ): Promise<CarInsuranceQuoteResponseDto> {
    const premium = await this.quoteService.calculatePremium(
      quote.ageOfDriver,
      quote.carId,
      quote.purchasePrice,
    );

    return premium;
  }

  @ApiOkResponse({
    type: CarInsuranceQuoteResponseDto,
    description: 'A car insurance quote.',
  })
  @Get(':id')
  public async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CarInsuranceQuoteResponseDto> {
    const premium = await this.quoteService.getById(id);
    if (!premium) {
      throw new NotFoundException();
    }
    return premium;
  }
}
```

Voila, now we can calculate a car insurance quote premium and retrieve it later. Both route handlers now return a `CarInsuranceQuoteResponseDto` instance. In this case, we can return the `Premium` instance returned by the quote service because the shape of this object matches with the `CarInsuranceQuoteResponseDto` response DTO. In other cases, you might need to map the result of the service to the response DTO. 

Testing our route handlers, we notice a few things:

- Calculating a car insurance quote now works. Yay!
- If a premium cannot be found a `404` response is returned.
- If you calculate a car insurance quote and the business rules are violated, then you will get a `500 Internal server error` response. In the next chapter `Exception Filters` we'll see how to fix this.

That's it for our simple car insurance quote service. Let's fix the response from the server when the business rules are violated next.
