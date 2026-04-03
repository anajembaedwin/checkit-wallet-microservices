import { Observable } from 'rxjs';

export interface GetUserByIdRequest {
  id: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface UserService {
  GetUserById(data: GetUserByIdRequest): Observable<User>;
}
