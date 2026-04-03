import { Test, TestingModule } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import { AppModule } from '../src/app.module';
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

describe('UserService (e2e)', () => {
  let app: INestMicroservice;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        user: {
          create: jest.fn(),
          findUnique: jest.fn(),
        },
      })
      .compile();

    app = moduleFixture.createNestMicroservice<MicroserviceOptions>({
      transport: Transport.GRPC,
      options: {
        package: 'user',
        protoPath: '../../packages/proto/user.proto',
        url: '0.0.0.0:50061',
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
