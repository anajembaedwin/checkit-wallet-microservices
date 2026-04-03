import { Module } from '@nestjs/common';
import { UserClient } from '../grpc/user.client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, PrismaService, UserClient],
})
export class WalletModule {}
