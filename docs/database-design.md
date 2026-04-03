# Database Design

## Overview

The system persists two main entities:

- `User`
- `Wallet`

The data model is intentionally simple and optimized for the assessment use case: one user owns one wallet.

## Entity Relationship

```text
User 1 ----- 1 Wallet
```

## User

Fields:

- `id`
- `email`
- `name`
- `createdAt`

Constraints:

- primary key on `id`
- unique constraint on `email`
- index on `email`

## Wallet

Fields:

- `id`
- `userId`
- `balance`
- `createdAt`

Constraints:

- primary key on `id`
- unique constraint on `userId`
- foreign key from `userId` to `User.id`
- index on `userId`

## Relationship Rules

- each user can have only one wallet
- each wallet must belong to a valid user
- deleting a user cascades to wallet deletion

## Why This Design

This structure supports:

- fast user lookup by email
- fast wallet lookup by user id
- strong one-to-one ownership between user and wallet
- straightforward balance updates

## Prisma Schema Source

See the canonical Prisma schema here:

- [packages/prisma/schema.prisma](../packages/prisma/schema.prisma)
