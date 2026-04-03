# gRPC Request Examples

This project is gRPC-only, so the most direct request examples are `grpcurl` commands.

## Prerequisites

- `user-service` running on `localhost:50051`
- `wallet-service` running on `localhost:50052`
- `grpcurl` installed locally

## Create User

```bash
grpcurl -plaintext \
  -import-path packages/proto \
  -proto user.proto \
  -d "{\"email\":\"jane@example.com\",\"name\":\"Jane Doe\"}" \
  localhost:50051 user.UserService/CreateUser
```

## Get User By Id

```bash
grpcurl -plaintext \
  -import-path packages/proto \
  -proto user.proto \
  -d "{\"id\":\"USER_ID_HERE\"}" \
  localhost:50051 user.UserService/GetUserById
```

## Get Wallet

```bash
grpcurl -plaintext \
  -import-path packages/proto \
  -proto wallet.proto \
  -d "{\"user_id\":\"USER_ID_HERE\"}" \
  localhost:50052 wallet.WalletService/GetWallet
```

## Credit Wallet

```bash
grpcurl -plaintext \
  -import-path packages/proto \
  -proto wallet.proto \
  -d "{\"user_id\":\"USER_ID_HERE\",\"amount\":500}" \
  localhost:50052 wallet.WalletService/CreditWallet
```

## Debit Wallet

```bash
grpcurl -plaintext \
  -import-path packages/proto \
  -proto wallet.proto \
  -d "{\"user_id\":\"USER_ID_HERE\",\"amount\":200}" \
  localhost:50052 wallet.WalletService/DebitWallet
```
