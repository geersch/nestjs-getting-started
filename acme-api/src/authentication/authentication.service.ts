import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserRepository } from './repositories/user.repository';
import { compare } from 'bcryptjs';

export type AuthenticatedUser = Omit<User, 'hashedPassword'>;

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  public async validate(
    username: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user: User = await this.userRepository.findByUsername(username);

    if (user && (await compare(password, user.hashedPassword))) {
      return { id: user.id, username: user.username };
    }

    return null;
  }

  public signin(user: AuthenticatedUser): string {
    const payload = { username: user.username, sub: user.id };
    return this.jwtService.sign(payload);
  }
}
