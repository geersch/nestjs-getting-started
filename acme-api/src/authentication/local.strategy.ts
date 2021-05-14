import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import {
  AuthenticationService,
  AuthenticationUser,
} from './authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authenticationService: AuthenticationService) {
    super();
  }

  public async validate(
    username: string,
    password: string,
  ): Promise<AuthenticationUser> {
    const user: AuthenticationUser | null =
      await this.authenticationService.validate(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
