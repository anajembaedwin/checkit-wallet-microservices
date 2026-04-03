import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

export function toRpcException(error: unknown): RpcException {
  if (error instanceof RpcException) {
    return error;
  }

  if (error instanceof BadRequestException) {
    return new RpcException({
      code: status.INVALID_ARGUMENT,
      message: error.message,
    });
  }

  if (error instanceof NotFoundException) {
    return new RpcException({
      code: status.NOT_FOUND,
      message: error.message,
    });
  }

  if (error instanceof ConflictException) {
    return new RpcException({
      code: status.ALREADY_EXISTS,
      message: error.message,
    });
  }

  if (
    error instanceof InternalServerErrorException ||
    error instanceof HttpException
  ) {
    return new RpcException({
      code: status.INTERNAL,
      message: error.message,
    });
  }

  return new RpcException({
    code: status.INTERNAL,
    message: 'Internal server error',
  });
}
