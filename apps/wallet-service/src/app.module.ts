import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  translateTime: 'SYS:standard',
                },
              }
            : undefined,
      },
    }),
    WalletModule,
  ],
})
export class AppModule {}
