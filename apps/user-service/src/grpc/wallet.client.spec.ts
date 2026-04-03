import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ClientGrpc } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { InternalServerErrorException } from '@nestjs/common';
import { WalletClient } from './wallet.client';
import type {
  CreateWalletRequest,
  Wallet,
  WalletService,
} from '../types/wallet.interface';

describe('WalletClient', () => {
  let client: WalletClient;
  let grpcClient: ClientGrpc;
  let createWalletMock: jest.MockedFunction<
    (data: CreateWalletRequest) => ReturnType<WalletService['CreateWallet']>
  >;
  let walletService: WalletService;

  beforeEach(() => {
    createWalletMock =
      jest.fn<
        (data: CreateWalletRequest) => ReturnType<WalletService['CreateWallet']>
      >();

    walletService = {
      CreateWallet: createWalletMock,
    };

    grpcClient = {
      getService: jest.fn().mockReturnValue(walletService),
    } as unknown as ClientGrpc;

    client = new WalletClient(grpcClient);
    client.onModuleInit();
  });

  it('creates a wallet through the wallet gRPC service', async () => {
    const wallet: Wallet = {
      id: 'wallet-1',
      user_id: 'user-1',
      balance: 0,
      created_at: new Date().toISOString(),
    };

    createWalletMock.mockReturnValue(of(wallet));

    await expect(client.createWallet('user-1')).resolves.toEqual(wallet);
    expect(grpcClient.getService).toHaveBeenCalledWith('WalletService');
    expect(createWalletMock).toHaveBeenCalledWith({
      user_id: 'user-1',
    });
  });

  it('surfaces a clear error when wallet creation fails', async () => {
    createWalletMock.mockReturnValue(
      throwError(() => new Error('wallet down')),
    );

    await expect(client.createWallet('user-1')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
