import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { of } from 'rxjs';
import type { ClientGrpc } from '@nestjs/microservices';
import { UserClient } from './user.client';
import type {
  GetUserByIdRequest,
  User,
  UserService,
} from '../types/user.interface';

describe('UserClient', () => {
  let client: UserClient;
  let grpcClient: ClientGrpc;
  let getServiceMock: jest.MockedFunction<(name: string) => UserService>;
  let getUserByIdMock: jest.MockedFunction<
    (data: GetUserByIdRequest) => ReturnType<UserService['GetUserById']>
  >;
  let userService: UserService;

  beforeEach(() => {
    getUserByIdMock =
      jest.fn<
        (data: GetUserByIdRequest) => ReturnType<UserService['GetUserById']>
      >();

    userService = {
      GetUserById: getUserByIdMock,
    };

    getServiceMock = jest
      .fn<(name: string) => UserService>()
      .mockReturnValue(userService);

    grpcClient = {
      getService: getServiceMock,
    } as unknown as ClientGrpc;

    client = new UserClient(grpcClient);
    client.onModuleInit();
  });

  it('resolves the UserService from the gRPC client', async () => {
    const user: User = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'User One',
      created_at: new Date().toISOString(),
    };

    getUserByIdMock.mockReturnValue(of(user));

    await expect(client.getUserById('user-1')).resolves.toEqual(user);
    expect(getServiceMock).toHaveBeenCalledWith('UserService');
    expect(getUserByIdMock).toHaveBeenCalledWith({ id: 'user-1' });
  });
});
