import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { UserClient } from '../grpc/user.client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

const userServiceUrl = process.env.USER_SERVICE_URL ?? 'localhost:50051';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'user',
          protoPath: join(process.cwd(), '../../packages/proto/user.proto'),
          url: userServiceUrl,
          loader: {
            keepCase: true,
          },
        },
      },
    ]),
  ],
  controllers: [WalletController],
  providers: [WalletService, PrismaService, UserClient],
})
export class WalletModule {}
