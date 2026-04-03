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
import {
  CreateWalletRequest,
  Wallet,
  WalletService,
} from '../types/wallet.interface';

@Injectable()
export class WalletClient implements OnModuleInit {
  private walletService!: WalletService;

  constructor(@Inject('WALLET_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.walletService = this.client.getService<WalletService>('WalletService');
  }

  async createWallet(userId: string): Promise<Wallet> {
    try {
      const request: CreateWalletRequest = { user_id: userId };
      return await firstValueFrom(this.walletService.CreateWallet(request));
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === status.NOT_FOUND
      ) {
        throw new NotFoundException('User not found');
      }

      throw new InternalServerErrorException(
        'User created but wallet setup failed',
      );
    }
  }
}
