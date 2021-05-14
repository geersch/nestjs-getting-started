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
