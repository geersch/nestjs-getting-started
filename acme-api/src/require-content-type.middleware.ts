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
