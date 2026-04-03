import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { of } from 'rxjs';
import type { ClientGrpc } from '@nestjs/microservices';
import { UserClient } from './user.client';
import type { UserService } from '../types/user.interface';

describe('UserClient', () => {
  let client: UserClient;
  let grpcClient: ClientGrpc;
  let userService: UserService;

  beforeEach(() => {
    userService = {
      GetUserById: jest.fn(),
    };

    grpcClient = {
      getService: jest.fn().mockReturnValue(userService),
    } as unknown as ClientGrpc;

    client = new UserClient(grpcClient);
    client.onModuleInit();
  });

  it('resolves the UserService from the gRPC client', async () => {
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'User One',
      created_at: new Date().toISOString(),
    };

    (userService.GetUserById as jest.Mock).mockReturnValue(of(user));

    await expect(client.getUserById('user-1')).resolves.toEqual(user);
    expect(grpcClient.getService).toHaveBeenCalledWith('UserService');
    expect(userService.GetUserById).toHaveBeenCalledWith({ id: 'user-1' });
  });
});
