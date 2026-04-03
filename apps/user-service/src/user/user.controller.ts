import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponse } from './interfaces/user.interface';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod('UserService', 'CreateUser')
  async createUser(data: CreateUserDto): Promise<UserResponse> {
    const user = await this.userService.createUser(data);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.createdAt.toISOString(),
    };
  }

  @GrpcMethod('UserService', 'GetUserById')
  async getUserById(data: { id: string }): Promise<UserResponse> {
    const user = await this.userService.getUserById(data.id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.createdAt.toISOString(),
    };
  }
}
