import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { User, UserRepository } from './user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  public async findByUsername(username: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: { username },
    });

    return user
      ? {
          id: user.id,
          username: user.username,
          hashedPassword: user.hashedPassword,
        }
      : null;
  }
}
