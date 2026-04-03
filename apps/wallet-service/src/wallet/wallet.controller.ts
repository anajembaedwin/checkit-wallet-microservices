import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CreditWalletDto } from './dto/credit-wallet.dto';
import { DebitWalletDto } from './dto/debit-wallet.dto';
import { WalletResponse } from './interfaces/wallet.interface';
import { WalletService } from './wallet.service';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @GrpcMethod('WalletService', 'CreateWallet')
  async createWallet(data: { user_id: string }): Promise<WalletResponse> {
    const wallet = await this.walletService.createWallet(data.user_id);

    return {
      id: wallet.id,
      user_id: wallet.userId,
      balance: wallet.balance,
      created_at: wallet.createdAt.toISOString(),
    };
  }

  @GrpcMethod('WalletService', 'GetWallet')
  async getWallet(data: { user_id: string }): Promise<WalletResponse> {
    const wallet = await this.walletService.getWallet(data.user_id);

    return {
      id: wallet.id,
      user_id: wallet.userId,
      balance: wallet.balance,
      created_at: wallet.createdAt.toISOString(),
    };
  }

  @GrpcMethod('WalletService', 'CreditWallet')
  async creditWallet(data: CreditWalletDto): Promise<WalletResponse> {
    const wallet = await this.walletService.creditWallet(data.user_id, data.amount);

    return {
      id: wallet.id,
      user_id: wallet.userId,
      balance: wallet.balance,
      created_at: wallet.createdAt.toISOString(),
    };
  }

  @GrpcMethod('WalletService', 'DebitWallet')
  async debitWallet(data: DebitWalletDto): Promise<WalletResponse> {
    const wallet = await this.walletService.debitWallet(data.user_id, data.amount);

    return {
      id: wallet.id,
      user_id: wallet.userId,
      balance: wallet.balance,
      created_at: wallet.createdAt.toISOString(),
    };
  }
}
