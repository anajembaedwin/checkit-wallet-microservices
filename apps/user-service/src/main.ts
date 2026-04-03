import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const protoPath = join(process.cwd(), '../../packages/proto/user.proto');
  const userServiceUrl = process.env.USER_SERVICE_URL ?? '0.0.0.0:50051';
  console.log('Proto path resolved to:', protoPath);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'user',
        protoPath,
        url: userServiceUrl,
        loader: {
          keepCase: true,
        },
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen();
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
