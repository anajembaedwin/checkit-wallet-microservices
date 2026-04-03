import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserClient } from '../grpc/user.client';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userClient: UserClient,
  ) {}

  async createWallet(userId: string) {
    await this.userClient.getUserById(userId);

    try {
      return await this.prisma.wallet.create({
        data: { userId },
      });
    } catch {
      throw new ConflictException('Wallet already exists for this user');
    }
  }

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async creditWallet(userId: string, amount: number) {
    this.assertPositiveAmount(amount);
    const wallet = await this.getWallet(userId);

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: wallet.balance + amount,
      },
    });
  }

  async debitWallet(userId: string, amount: number) {
    this.assertPositiveAmount(amount);
    const wallet = await this.getWallet(userId);

    if (wallet.balance < amount) {
      throw new ConflictException('Insufficient wallet balance');
    }

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: wallet.balance - amount,
      },
    });
  }

  private assertPositiveAmount(amount: number) {
    if (amount <= 0) {
      throw new ConflictException('Amount must be greater than zero');
    }
  }
}
