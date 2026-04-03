import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from '@jest/globals';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Client } from 'pg';
import { spawn, type ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import { join } from 'path';

type UserResponse = {
  id: string;
  email: string;
  name: string;
  created_at: string;
};

type WalletResponse = {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
};

type UserServiceClient = grpc.Client & {
  CreateUser(
    request: { email: string; name: string },
    callback: (error: grpc.ServiceError | null, response: UserResponse) => void,
  ): void;
};

type WalletServiceClient = grpc.Client & {
  GetWallet(
    request: { user_id: string },
    callback: (
      error: grpc.ServiceError | null,
      response: WalletResponse,
    ) => void,
  ): void;
  CreditWallet(
    request: { user_id: string; amount: number },
    callback: (
      error: grpc.ServiceError | null,
      response: WalletResponse,
    ) => void,
  ): void;
  DebitWallet(
    request: { user_id: string; amount: number },
    callback: (
      error: grpc.ServiceError | null,
      response: WalletResponse,
    ) => void,
  ): void;
};

const rootDir =
  'c:\\Users\\anaje\\Documents\\Github\\ContractWorkProjects\\checkit-wallet-microservices';
const databaseUrl = 'postgresql://postgres:229494@localhost:5432/wallet_db';
const userServiceAddress = 'localhost:50071';
const walletServiceAddress = 'localhost:50072';

describe('Wallet Flow Integration', () => {
  let userProcess: ChildProcess;
  let walletProcess: ChildProcess;
  let userClient: UserServiceClient;
  let walletClient: WalletServiceClient;

  beforeAll(async () => {
    await resetDatabase();

    walletProcess = startService('apps\\wallet-service');
    userProcess = startService('apps\\user-service');

    userClient = createUserClient();
    walletClient = createWalletClient();

    await Promise.all([
      waitForReady(userClient, 'localhost:50051'),
      waitForReady(walletClient, 'localhost:50052'),
    ]);
  }, 30000);

  afterAll(async () => {
    userClient?.close();
    walletClient?.close();

    userProcess?.kill();
    walletProcess?.kill();

    await resetDatabase();
  }, 15000);

  it(
    'creates a user, auto-provisions a wallet, credits, debits, and fetches the final balance',
    async () => {
      const email = `integration-${randomUUID()}@example.com`;

      const createdUser = await createUser(userClient, {
        email,
        name: 'Integration Test User',
      });

      expect(createdUser.email).toBe(email);
      expect(createdUser.name).toBe('Integration Test User');
      expect(createdUser.id).toBeTruthy();

      const createdWallet = await getWallet(walletClient, createdUser.id);
      expect(createdWallet.user_id).toBe(createdUser.id);
      expect(createdWallet.balance).toBe(0);

      const creditedWallet = await creditWallet(walletClient, createdUser.id, 500);
      expect(creditedWallet.balance).toBe(500);

      const debitedWallet = await debitWallet(walletClient, createdUser.id, 200);
      expect(debitedWallet.balance).toBe(300);

      const finalWallet = await getWallet(walletClient, createdUser.id);
      expect(finalWallet.balance).toBe(300);
    },
    30000,
  );
});

function startService(relativePath: string): ChildProcess {
  const serviceDir = join(rootDir, relativePath);
  const child = spawn('node', ['dist/main.js'], {
    cwd: serviceDir,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      USER_SERVICE_URL: userServiceAddress,
      WALLET_SERVICE_URL: walletServiceAddress,
    },
    stdio: 'ignore',
  });

  return child;
}

function createUserClient(): UserServiceClient {
  const protoPath = join(rootDir, 'packages', 'proto', 'user.proto');
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
  });
  const loaded = grpc.loadPackageDefinition(packageDefinition) as unknown as {
    user: {
      UserService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
      ) => UserServiceClient;
    };
  };

  return new loaded.user.UserService(
    userServiceAddress,
    grpc.credentials.createInsecure(),
  );
}

function createWalletClient(): WalletServiceClient {
  const protoPath = join(rootDir, 'packages', 'proto', 'wallet.proto');
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
  });
  const loaded = grpc.loadPackageDefinition(packageDefinition) as unknown as {
    wallet: {
      WalletService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
      ) => WalletServiceClient;
    };
  };

  return new loaded.wallet.WalletService(
    walletServiceAddress,
    grpc.credentials.createInsecure(),
  );
}

function waitForReady(client: grpc.Client, address: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.waitForReady(Date.now() + 10000, (error) => {
      if (error) {
        reject(
          new Error(`Service at ${address} did not become ready: ${error.message}`),
        );
        return;
      }

      resolve();
    });
  });
}

function createUser(
  client: UserServiceClient,
  request: { email: string; name: string },
): Promise<UserResponse> {
  return new Promise((resolve, reject) => {
    client.CreateUser(request, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
}

function getWallet(
  client: WalletServiceClient,
  userId: string,
): Promise<WalletResponse> {
  return new Promise((resolve, reject) => {
    client.GetWallet({ user_id: userId }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
}

function creditWallet(
  client: WalletServiceClient,
  userId: string,
  amount: number,
): Promise<WalletResponse> {
  return new Promise((resolve, reject) => {
    client.CreditWallet({ user_id: userId, amount }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
}

function debitWallet(
  client: WalletServiceClient,
  userId: string,
  amount: number,
): Promise<WalletResponse> {
  return new Promise((resolve, reject) => {
    client.DebitWallet({ user_id: userId, amount }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
}

async function resetDatabase() {
  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();
  await client.query('DELETE FROM "Wallet";');
  await client.query('DELETE FROM "User";');
  await client.end();
}
