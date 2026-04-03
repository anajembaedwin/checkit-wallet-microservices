import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'user',
        protoPath: join(__dirname, '../../../../packages/proto/user.proto'),
        url: '0.0.0.0:50051',
      },
    },
  );

  await app.listen();
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
