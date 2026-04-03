import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletClient } from '../grpc/wallet.client';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: {
      create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
      findUnique: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
      delete: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    };
  };
  let walletClient: {
    createWallet: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };

  beforeEach(() => {
    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    walletClient = {
      createWallet: jest.fn(),
    };

    service = new UserService(
      prisma as unknown as PrismaService,
      walletClient as unknown as WalletClient,
    );
  });

  it('creates a user and provisions a wallet', async () => {
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'User One',
      createdAt: new Date(),
    };

    prisma.user.create.mockResolvedValue(user);
    walletClient.createWallet.mockResolvedValue({
      id: 'wallet-1',
      user_id: 'user-1',
      balance: 0,
      created_at: new Date().toISOString(),
    });

    await expect(
      service.createUser({ email: 'user@example.com', name: 'User One' }),
    ).resolves.toEqual(user);
    expect(walletClient.createWallet).toHaveBeenCalledWith('user-1');
  });

  it('removes the user if wallet provisioning fails', async () => {
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'User One',
      createdAt: new Date(),
    };

    prisma.user.create.mockResolvedValue(user);
    walletClient.createWallet.mockRejectedValue(
      new InternalServerErrorException('User created but wallet setup failed'),
    );

    await expect(
      service.createUser({ email: 'user@example.com', name: 'User One' }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });

  it('throws a conflict error for duplicate email', async () => {
    prisma.user.create.mockRejectedValue(new Error('duplicate email'));

    await expect(
      service.createUser({ email: 'user@example.com', name: 'User One' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns a user by id', async () => {
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'User One',
      createdAt: new Date(),
    };

    prisma.user.findUnique.mockResolvedValue(user);

    await expect(service.getUserById('user-1')).resolves.toEqual(user);
  });

  it('throws when a user is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getUserById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
