import { Injectable } from '@nestjs/common';

export interface User {
  id: number;
  username: string;
  password: string;
}

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    { id: 1, username: 'Bob', password: 'abc123' },
    { id: 2, username: 'Alice', password: 'def456' },
  ];

  public async findByUsername(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }
}
