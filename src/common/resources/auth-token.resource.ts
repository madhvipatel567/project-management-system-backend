import { Expose } from 'class-transformer';

export class AuthTokenResource {
  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;

  @Expose()
  expiresAt: number;
}
