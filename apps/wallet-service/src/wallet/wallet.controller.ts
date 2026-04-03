import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CreditWalletDto } from './dto/credit-wallet.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { DebitWalletDto } from './dto/debit-wallet.dto';
import { GetWalletDto } from './dto/get-wallet.dto';
import { toRpcException } from '../common/grpc-exception.util';
import { WalletResponse } from './interfaces/wallet.interface';
import { WalletService } from './wallet.service';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @GrpcMethod('WalletService', 'CreateWallet')
  async createWallet(data: CreateWalletDto): Promise<WalletResponse> {
    try {
      const wallet = await this.walletService.createWallet(data.user_id);

      return {
        id: wallet.id,
        user_id: wallet.userId,
        balance: wallet.balance,
        created_at: wallet.createdAt.toISOString(),
      };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('WalletService', 'GetWallet')
  async getWallet(data: GetWalletDto): Promise<WalletResponse> {
    try {
      const wallet = await this.walletService.getWallet(data.user_id);

      return {
        id: wallet.id,
        user_id: wallet.userId,
        balance: wallet.balance,
        created_at: wallet.createdAt.toISOString(),
      };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('WalletService', 'CreditWallet')
  async creditWallet(data: CreditWalletDto): Promise<WalletResponse> {
    try {
      const wallet = await this.walletService.creditWallet(
        data.user_id,
        data.amount,
      );

      return {
        id: wallet.id,
        user_id: wallet.userId,
        balance: wallet.balance,
        created_at: wallet.createdAt.toISOString(),
      };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('WalletService', 'DebitWallet')
  async debitWallet(data: DebitWalletDto): Promise<WalletResponse> {
    try {
      const wallet = await this.walletService.debitWallet(
        data.user_id,
        data.amount,
      );

      return {
        id: wallet.id,
        user_id: wallet.userId,
        balance: wallet.balance,
        created_at: wallet.createdAt.toISOString(),
      };
    } catch (error) {
      throw toRpcException(error);
    }
  }
}
