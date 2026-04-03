import { IsInt, IsUUID, Min } from 'class-validator';

export class DebitWalletDto {
  @IsUUID()
  user_id!: string;

  @IsInt()
  @Min(1)
  amount!: number;
}
