import { Expose, Transform } from 'class-transformer';

export class UserRolePermissionsResource {
  @Expose()
  @Transform(({ value, obj }) => obj.permission.name)
  permissionName: string;

  @Expose()
  operations: string[];
}
