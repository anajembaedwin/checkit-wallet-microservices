# Checkit Wallet Microservices

![Node.js](https://img.shields.io/badge/node-20%2B-339933?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/nestjs-11-E0234E?logo=nestjs&logoColor=white)
![gRPC](https://img.shields.io/badge/gRPC-microservices-244c5a)
![Prisma](https://img.shields.io/badge/prisma-7-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-15-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)
![Jest](https://img.shields.io/badge/tests-passing-15C213?logo=jest&logoColor=white)
![CI](https://img.shields.io/badge/ci-github_actions-2088FF?logo=githubactions&logoColor=white)

Backend engineer assessment solution built with NestJS, gRPC, Prisma, PostgreSQL, and an npm workspace monorepo.

## Table of Contents

- [Overview](#overview)
- [What This Project Does](#what-this-project-does)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Services](#services)
- [Database Design](#database-design)
- [API Contracts](#api-contracts)
- [Swagger and API Docs](#swagger-and-api-docs)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Running the Services](#running-the-services)
- [Testing](#testing)
- [Example Requests](#example-requests)
- [Additional Documentation](#additional-documentation)
- [Notes](#notes)

## Overview

This project contains two gRPC microservices:

- `user-service`
- `wallet-service`

The services communicate over gRPC inside a monorepo. When a user is created, the system automatically provisions a wallet for that user.

This repository is designed to demonstrate:

- clean NestJS service boundaries
- gRPC contract-first communication
- Prisma-backed persistence with PostgreSQL
- validation and error handling
- transaction-safe wallet debits
- CI-backed testing, including an integration flow

## What This Project Does

The system models a simple wallet platform:

- `user-service` creates and fetches users
- `wallet-service` manages wallet balances
- `wallet-service` verifies users by calling `user-service` over gRPC
- `user-service` auto-provisions a wallet after successful user creation

User creation flow:

1. client calls `user.UserService/CreateUser`
2. `user-service` writes the user to PostgreSQL
3. `user-service` calls `wallet.WalletService/CreateWallet`
4. `wallet-service` verifies the user through `user.UserService/GetUserById`
5. wallet is created and linked to the user

## Architecture

High-level request flow:

```text
Client
  |
  +--> user-service (gRPC :50051)
  |       |
  |       +--> PostgreSQL
  |       |
  |       +--> wallet-service (gRPC :50052)
  |
  +--> wallet-service (gRPC :50052)
          |
          +--> user-service (gRPC :50051)
          |
          +--> PostgreSQL
```

Design principles used here:

- controllers handle gRPC transport only
- services contain business logic only
- Prisma access is isolated in `PrismaService`
- inter-service calls are wrapped in dedicated gRPC client classes
- request validation is enforced at the gRPC boundary

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
|-- docs/
`-- integration/
```

## Technology Stack

- NestJS 11
- gRPC
- Prisma 7
- PostgreSQL 15
- Docker
- Jest
- GitHub Actions
- `nestjs-pino` for structured logging

## Services

### User Service

gRPC package: `user`  
Default port: `50051`

Methods:

- `CreateUser`
- `GetUserById`

Responsibilities:

- create users
- fetch users by id
- auto-create wallets after user creation
- roll back user creation if wallet provisioning fails

### Wallet Service

gRPC package: `wallet`  
Default port: `50052`

Methods:

- `CreateWallet`
- `GetWallet`
- `CreditWallet`
- `DebitWallet`

Responsibilities:

- create wallets
- fetch wallets by user id
- credit balances atomically
- debit balances using a transaction-safe update strategy
- verify user existence through `user-service`

## Database Design

Entity sketch:

```text
+----------------------+
| User                 |
+----------------------+
| id        UUID/STR   | PK
| email     STRING     | UNIQUE
| name      STRING     |
| createdAt DATETIME   |
+----------------------+
           |
           | 1 : 1
           |
+----------------------+
| Wallet               |
+----------------------+
| id        UUID/STR   | PK
| userId    STRING     | UNIQUE, FK -> User.id
| balance   INTEGER    |
| createdAt DATETIME   |
+----------------------+
```

Relationship summary:

- one user has one wallet
- one wallet belongs to one user
- deleting a user cascades to the wallet

Detailed design notes are in [docs/database-design.md](docs/database-design.md).

## API Contracts

Proto files:

- [packages/proto/user.proto](packages/proto/user.proto)
- [packages/proto/wallet.proto](packages/proto/wallet.proto)

The contracts use snake_case payload fields, including:

- `created_at`
- `user_id`

## Swagger and API Docs

This project is gRPC-first, so there is no hosted Swagger UI endpoint inside the services.

Instead, the repository includes an OpenAPI-style documentation file at:

- [docs/openapi.yaml](docs/openapi.yaml)

How to access it:

1. Open [Swagger Editor](https://editor.swagger.io/)
2. Copy/paste the contents of `docs/openapi.yaml`, or import the file
3. Use it as a documentation layer for the gRPC request/response payloads

Important note:

- this OpenAPI file is documentation-only
- the actual runtime API is gRPC, not REST

If you want executable request examples, use:

- [docs/grpcurl-examples.md](docs/grpcurl-examples.md)

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

## Getting Started

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
npm run test:user
```

Run `wallet-service` tests:

```bash
npm run test:wallet
```

Run integration flow:

```bash
npm run test:integration
```

What the integration test covers:

- create user
- verify wallet auto-provisioning
- credit wallet
- debit wallet
- fetch final wallet state

## Example Requests

The examples below use `grpcurl`.

### Create User

```bash
grpcurl -plaintext \
  -import-path packages/proto \
  -proto user.proto \
  -d "{\"email\":\"jane@example.com\",\"name\":\"Jane Doe\"}" \
  localhost:50051 user.UserService/CreateUser
```

### Get User By Id

```bash
grpcurl -plaintext \
  -import-path packages/proto \
  -proto user.proto \
  -d "{\"id\":\"USER_ID_HERE\"}" \
  localhost:50051 user.UserService/GetUserById
```

### Get Wallet

```bash
grpcurl -plaintext \
  -import-path packages/proto \
  -proto wallet.proto \
  -d "{\"user_id\":\"USER_ID_HERE\"}" \
  localhost:50052 wallet.WalletService/GetWallet
```

### Credit Wallet

```bash
grpcurl -plaintext \
  -import-path packages/proto \
  -proto wallet.proto \
  -d "{\"user_id\":\"USER_ID_HERE\",\"amount\":500}" \
  localhost:50052 wallet.WalletService/CreditWallet
```

### Debit Wallet

```bash
grpcurl -plaintext \
  -import-path packages/proto \
  -proto wallet.proto \
  -d "{\"user_id\":\"USER_ID_HERE\",\"amount\":200}" \
  localhost:50052 wallet.WalletService/DebitWallet
```

More examples are available in [docs/grpcurl-examples.md](docs/grpcurl-examples.md).

## Additional Documentation

- [docs/grpcurl-examples.md](docs/grpcurl-examples.md)
- [docs/openapi.yaml](docs/openapi.yaml)
- [docs/database-design.md](docs/database-design.md)

## Notes

- `wallet-service` depends on `user-service` for user verification
- validation is enforced with `class-validator`
- known application failures are mapped to explicit gRPC status codes
- integration tests run services on isolated ports to avoid clashes with local dev processes
- CI runs type checks, unit tests, and the integration flow
