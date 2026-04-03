import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserClient } from '../grpc/user.client';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userClient: UserClient,
  ) {}

  async createWallet(userId: string) {
    await this.userClient.getUserById(userId);

    try {
      const wallet = await this.prisma.wallet.create({
        data: { userId },
      });
      this.logger.log({ userId, walletId: wallet.id }, 'Wallet created');
      return wallet;
    } catch {
      this.logger.warn({ userId }, 'Wallet creation rejected because wallet exists');
      throw new ConflictException('Wallet already exists for this user');
    }
  }

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      this.logger.warn({ userId }, 'Wallet lookup failed');
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async creditWallet(userId: string, amount: number) {
    this.assertPositiveAmount(amount);
    await this.getWallet(userId);

    return this.prisma.wallet.update({
      where: { userId },
      data: {
        balance: {
          increment: amount,
        },
      },
    });
  }

  async debitWallet(userId: string, amount: number) {
    this.assertPositiveAmount(amount);

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.wallet.updateMany({
        where: {
          userId,
          balance: {
            gte: amount,
          },
        },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      if (result.count === 0) {
        const wallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          this.logger.warn({ userId }, 'Debit rejected because wallet was not found');
          throw new NotFoundException('Wallet not found');
        }

        this.logger.warn(
          { userId, amount, balance: wallet.balance },
          'Debit rejected because balance is insufficient',
        );
        throw new ConflictException('Insufficient wallet balance');
      }

      const updatedWallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!updatedWallet) {
        this.logger.warn({ userId }, 'Debit completed but wallet lookup failed');
        throw new NotFoundException('Wallet not found');
      }

      this.logger.log(
        { userId, amount, balance: updatedWallet.balance },
        'Wallet debited',
      );
      return updatedWallet;
    });
  }

  private assertPositiveAmount(amount: number) {
    if (amount <= 0) {
      throw new ConflictException('Amount must be greater than zero');
    }
  }
}
