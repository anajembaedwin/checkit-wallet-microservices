import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WalletClient } from '../grpc/wallet.client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletClient: WalletClient,
  ) {}

  async createUser(data: CreateUserDto) {
    let user;

    try {
      user = await this.prisma.user.create({
        data,
      });
      this.logger.log({ userId: user.id, email: user.email }, 'User created');
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.warn({ email: data.email }, 'Duplicate user email rejected');
        throw new ConflictException('User with this email already exists');
      }

      this.logger.error({ err: error, email: data.email }, 'Failed to create user');
      throw new ConflictException('User with this email already exists');
    }

    try {
      await this.walletClient.createWallet(user.id);
      this.logger.log({ userId: user.id }, 'Wallet auto-provisioned');
    } catch (error) {
      await this.prisma.user.delete({
        where: { id: user.id },
      });
      this.logger.error(
        { err: error, userId: user.id },
        'Wallet provisioning failed; user rolled back',
      );
      throw error instanceof Error
        ? error
        : new InternalServerErrorException('User created but wallet setup failed');
    }

    return user;
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      this.logger.warn({ userId: id }, 'User lookup failed');
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
