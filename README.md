# Checkit Wallet Microservices

Backend engineer assessment solution built with NestJS, gRPC, Prisma, PostgreSQL, and an npm workspace monorepo.

## Overview

This project contains two gRPC microservices:

- `user-service`
- `wallet-service`

The services communicate over gRPC inside a monorepo. Creating a user automatically provisions a wallet for that user.

## Project Structure

```text
checkit-wallet-microservices/
|-- apps/
|   |-- user-service/
|   `-- wallet-service/
|-- packages/
|   |-- prisma/
|   `-- proto/
|-- docker/
`-- integration/
```

## Tech Stack

- NestJS
- gRPC
- Prisma 7
- PostgreSQL
- Docker
- Jest

## Services

### User Service

gRPC package: `user`  
Default port: `50051`

Methods:

- `CreateUser`
- `GetUserById`

Behavior:

- Creates users
- Automatically triggers wallet creation through `wallet-service`

### Wallet Service

gRPC package: `wallet`  
Default port: `50052`

Methods:

- `CreateWallet`
- `GetWallet`
- `CreditWallet`
- `DebitWallet`

Behavior:

- Verifies users through `user-service`
- Supports atomic credits
- Uses a transaction-safe debit flow to reduce balance race conditions

## Prerequisites

- Node.js
- npm
- Docker Desktop

## Environment Variables

Create a root `.env` file if it does not already exist:

```env
DATABASE_URL="postgresql://postgres:229494@localhost:5432/wallet_db"
```

Optional runtime overrides:

```env
USER_SERVICE_URL="0.0.0.0:50051"
WALLET_SERVICE_URL="0.0.0.0:50052"
```

These are useful for integration tests or running services on alternate ports.

## Setup

Install dependencies:

```bash
npm install
```

Start PostgreSQL:

```bash
npm run docker:up
```

Apply Prisma migrations:

```bash
npm run prisma:migrate
```

Generate Prisma client:

```bash
npm run prisma:generate
```

## Running the Services

Run `wallet-service`:

```bash
npm run dev:wallet
```

Run `user-service`:

```bash
npm run dev:user
```

Build everything:

```bash
npm run build
```

## Testing

Run `user-service` tests:

```bash
npm run test --workspace=apps/user-service -- --runInBand
```

Run `wallet-service` tests:

```bash
npm run test --workspace=apps/wallet-service -- --runInBand
```

Run integration flow:

```bash
npm run test:integration
```

## gRPC Contracts

Proto files:

- `packages/proto/user.proto`
- `packages/proto/wallet.proto`

The services use snake_case fields in the gRPC contract, including `created_at` and `user_id`.

## Example Requests

The examples below use `grpcurl`.

### 1. Create User

```bash
grpcurl -plaintext \
  -import-path packages/proto \
  -proto user.proto \
  -d "{\"email\":\"jane@example.com\",\"name\":\"Jane Doe\"}" \
  localhost:50051 user.UserService/CreateUser
```

Expected behavior:

- user is created
- wallet is auto-created for that user

### 2. Get User By Id

```bash
grpcurl -plaintext \
  -import-path packages/proto \
  -proto user.proto \
  -d "{\"id\":\"USER_ID_HERE\"}" \
  localhost:50051 user.UserService/GetUserById
```

### 3. Get Wallet

```bash
grpcurl -plaintext \
  -import-path packages/proto \
  -proto wallet.proto \
  -d "{\"user_id\":\"USER_ID_HERE\"}" \
  localhost:50052 wallet.WalletService/GetWallet
```

### 4. Credit Wallet

```bash
grpcurl -plaintext \
  -import-path packages/proto \
  -proto wallet.proto \
  -d "{\"user_id\":\"USER_ID_HERE\",\"amount\":500}" \
  localhost:50052 wallet.WalletService/CreditWallet
```

### 5. Debit Wallet

```bash
grpcurl -plaintext \
  -import-path packages/proto \
  -proto wallet.proto \
  -d "{\"user_id\":\"USER_ID_HERE\",\"amount\":200}" \
  localhost:50052 wallet.WalletService/DebitWallet
```

## Notes

- `wallet-service` depends on `user-service` for user verification.
- Validation is enabled at the gRPC boundary with `class-validator`.
- Known application errors are mapped to explicit gRPC status responses.
- Integration tests run services on isolated ports to avoid clashes with local dev processes.
