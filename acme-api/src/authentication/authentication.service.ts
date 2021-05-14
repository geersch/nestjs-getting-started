import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UsersService } from './users.service';

export type AuthenticationUser = Omit<User, 'password'>;

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  public async validate(
    username: string,
    password: string,
  ): Promise<AuthenticationUser | null> {
    const user: User = await this.usersService.findByUsername(username);
    if (user?.password === password) {
      // Strip the password from the user object by destructuring it and spreading the other
      // properties into the authenticatedUser object.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...authenticatedUser } = user;
      return authenticatedUser;
    }

    return null;
  }

  public signin(user: AuthenticationUser): string {
    const payload = { username: user.username, sub: user.id };
    return this.jwtService.sign(payload);
  }
}
