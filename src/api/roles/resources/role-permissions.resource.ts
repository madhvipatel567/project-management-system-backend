import { Expose, Transform } from 'class-transformer';
import { RoleResource } from './role.resource';

class RolePermissionMapping {
  @Expose()
  name: string;

  @Expose()
  id: number;

  @Expose()
  operations: string[];
}

export class RolePermissionsResource {
  @Expose()
  role: RoleResource;

  @Expose()
  rolePermissions: RolePermissionMapping;
}
