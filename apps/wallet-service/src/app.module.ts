import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'user',
          protoPath: join(process.cwd(), '../../packages/proto/user.proto'),
          url: 'localhost:50051',
        },
      },
    ]),
    WalletModule,
  ],
})
export class AppModule {}
