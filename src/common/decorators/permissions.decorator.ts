import { SetMetadata } from '@nestjs/common';
import { Operations } from '../constants';

export const ROLES_KEY = 'permissions';
export const MODULE_KEY = 'module';

export enum Roles {
  SUPERADMIN = 'SuperAdmin',
  ADMIN = 'Admin',
  ROLE_BASED_USER = 'User',
}

export class RolePermissionMappingGaurd {
  roles: Roles[];
  operations?: Operations[];
  module?: string;
}

export const Permissions = (...permissions: RolePermissionMappingGaurd[]) =>
  SetMetadata(ROLES_KEY, permissions);
