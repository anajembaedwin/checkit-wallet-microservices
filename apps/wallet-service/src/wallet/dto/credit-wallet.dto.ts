import { IsInt, IsUUID, Min } from 'class-validator';

export class CreditWalletDto {
  @IsUUID()
  user_id!: string;

  @IsInt()
  @Min(1)
  amount!: number;
}
