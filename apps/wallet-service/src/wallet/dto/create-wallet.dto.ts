import { IsUUID } from 'class-validator';

export class CreateWalletDto {
  @IsUUID()
  user_id!: string;
}
