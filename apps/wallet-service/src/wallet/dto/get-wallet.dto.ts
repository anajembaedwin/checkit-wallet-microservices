import { IsUUID } from 'class-validator';

export class GetWalletDto {
  @IsUUID()
  user_id!: string;
}
