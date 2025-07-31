import { UserRole } from '../../common/enums';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  iat: number; // Issued at
}