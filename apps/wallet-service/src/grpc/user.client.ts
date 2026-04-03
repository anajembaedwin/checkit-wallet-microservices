import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { GetUserByIdRequest, User, UserService } from '../types/user.interface';

@Injectable()
export class UserClient implements OnModuleInit {
  private userService!: UserService;

  constructor(@Inject('USER_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserService>('UserService');
  }

  async getUserById(id: string): Promise<User> {
    const request: GetUserByIdRequest = { id };
    return firstValueFrom(this.userService.GetUserById(request));
  }
}
