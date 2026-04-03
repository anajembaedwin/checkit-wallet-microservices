import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { WalletClient } from '../grpc/wallet.client';
import { PrismaService } from '../prisma/prisma.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'WALLET_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'wallet',
          protoPath: join(process.cwd(), '../../packages/proto/wallet.proto'),
          url: 'localhost:50052',
          loader: {
            keepCase: true,
          },
        },
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, PrismaService, WalletClient],
})
export class UserModule {}
