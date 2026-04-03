import { Observable } from 'rxjs';

export interface CreateWalletRequest {
  user_id: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
}

export interface WalletService {
  CreateWallet(data: CreateWalletRequest): Observable<Wallet>;
}
