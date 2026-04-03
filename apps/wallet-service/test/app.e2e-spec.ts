import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserClient } from '../src/grpc/user.client';

describe('WalletService (e2e)', () => {
  let app: INestMicroservice;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        wallet: {
          create: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn(),
        },
      })
      .overrideProvider(UserClient)
      .useValue({
        getUserById: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
      transport: Transport.GRPC,
      options: {
        package: 'wallet',
        protoPath: '../../packages/proto/wallet.proto',
        url: '0.0.0.0:50062',
        loader: {
          keepCase: true,
        },
      },
    });

    await app.listen();
  });

  it('boots the gRPC microservice', () => {
    expect(app).toBeDefined();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
