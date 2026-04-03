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
          throw new NotFoundException('Wallet not found');
        }

        throw new ConflictException('Insufficient wallet balance');
      }

      const updatedWallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!updatedWallet) {
        throw new NotFoundException('Wallet not found');
      }

      return updatedWallet;
    });
  }

  private assertPositiveAmount(amount: number) {
    if (amount <= 0) {
      throw new ConflictException('Amount must be greater than zero');
    }
  }
}
