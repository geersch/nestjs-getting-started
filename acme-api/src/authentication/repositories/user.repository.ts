export interface User {
  id: number;
  username: string;
  hashedPassword: string;
}

export abstract class UserRepository {
  public abstract findByUsername(id: string): Promise<User | null>;
}
