import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const walletServiceUrl = process.env.WALLET_SERVICE_URL ?? '0.0.0.0:50052';
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'wallet',
        protoPath: join(process.cwd(), '../../packages/proto/wallet.proto'),
        url: walletServiceUrl,
        loader: {
          keepCase: true,
        },
      },
    },
  );

  app.useLogger(app.get(Logger));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen();
}

bootstrap().catch((error) => {
  console.error('Bootstrap failed', error);
  process.exit(1);
});
