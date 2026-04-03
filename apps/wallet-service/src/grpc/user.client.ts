import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
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
    try {
      const request: GetUserByIdRequest = { id };
      return await firstValueFrom(this.userService.GetUserById(request));
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === status.NOT_FOUND
      ) {
        throw new NotFoundException('User not found');
      }

      throw new InternalServerErrorException('Unable to verify user');
    }
  }
}
