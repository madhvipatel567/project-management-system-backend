import { Expose, Transform } from 'class-transformer';

export class RoleResource {
  @Expose({ name: 'id' })
  @Transform(({ value }) => Number(value))
  id: number;

  @Expose()
  roleUniqueId: string;

  @Expose()
  roleName: string;

  @Expose()
  totalUsers: number;

  @Expose()
  roleDescription: string;

  @Expose()
  isAuthorized: boolean;
}
