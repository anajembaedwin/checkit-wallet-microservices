import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WalletClient } from '../grpc/wallet.client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
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
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User with this email already exists');
      }

      throw new ConflictException('User with this email already exists');
    }

    try {
      await this.walletClient.createWallet(user.id);
    } catch (error) {
      await this.prisma.user.delete({
        where: { id: user.id },
      });
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
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
