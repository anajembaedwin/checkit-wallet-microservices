import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserClient } from '../grpc/user.client';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: {
    wallet: {
      create: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
      findUnique: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
      update: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
    };
  };
  let userClient: {
    getUserById: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  };

  beforeEach(() => {
    prisma = {
      wallet: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    userClient = {
      getUserById: jest.fn(),
    };

    service = new WalletService(
      prisma as unknown as PrismaService,
      userClient as unknown as UserClient,
    );
  });

  it('creates a wallet after confirming the user exists via gRPC', async () => {
    const wallet = {
      id: 'wallet-1',
      userId: 'user-1',
      balance: 0,
      createdAt: new Date(),
    };

    userClient.getUserById.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      created_at: new Date().toISOString(),
    });
    prisma.wallet.create.mockResolvedValue(wallet);

    await expect(service.createWallet('user-1')).resolves.toEqual(wallet);
    expect(userClient.getUserById).toHaveBeenCalledWith('user-1');
    expect(prisma.wallet.create).toHaveBeenCalledWith({
      data: { userId: 'user-1' },
    });
  });

  it('returns a wallet by user id', async () => {
    const wallet = {
      id: 'wallet-1',
      userId: 'user-1',
      balance: 1200,
      createdAt: new Date(),
    };

    prisma.wallet.findUnique.mockResolvedValue(wallet);

    await expect(service.getWallet('user-1')).resolves.toEqual(wallet);
    expect(prisma.wallet.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('throws when a wallet is not found', async () => {
    prisma.wallet.findUnique.mockResolvedValue(null);

    await expect(service.getWallet('missing-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('credits an existing wallet', async () => {
    const wallet = {
      id: 'wallet-1',
      userId: 'user-1',
      balance: 1000,
      createdAt: new Date(),
    };
    const updatedWallet = { ...wallet, balance: 1500 };

    prisma.wallet.findUnique.mockResolvedValue(wallet);
    prisma.wallet.update.mockResolvedValue(updatedWallet);

    await expect(service.creditWallet('user-1', 500)).resolves.toEqual(
      updatedWallet,
    );
    expect(prisma.wallet.update).toHaveBeenCalledWith({
      where: { id: 'wallet-1' },
      data: { balance: 1500 },
    });
  });

  it('rejects non-positive credit amounts', async () => {
    await expect(service.creditWallet('user-1', 0)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('debits an existing wallet', async () => {
    const wallet = {
      id: 'wallet-1',
      userId: 'user-1',
      balance: 1000,
      createdAt: new Date(),
    };
    const updatedWallet = { ...wallet, balance: 700 };

    prisma.wallet.findUnique.mockResolvedValue(wallet);
    prisma.wallet.update.mockResolvedValue(updatedWallet);

    await expect(service.debitWallet('user-1', 300)).resolves.toEqual(
      updatedWallet,
    );
    expect(prisma.wallet.update).toHaveBeenCalledWith({
      where: { id: 'wallet-1' },
      data: { balance: 700 },
    });
  });

  it('rejects non-positive debit amounts', async () => {
    await expect(service.debitWallet('user-1', -10)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects debits that exceed balance', async () => {
    prisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet-1',
      userId: 'user-1',
      balance: 100,
      createdAt: new Date(),
    });

    await expect(service.debitWallet('user-1', 200)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
