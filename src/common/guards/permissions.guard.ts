import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolePermissionMappingService } from 'src/api/role-permission-mappings/role-permission-mapping..service';
import {
  RolePermissionMappingGaurd,
  Roles,
} from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolePermissionMappingService: RolePermissionMappingService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const roleAndPermissions = this.reflector.get<RolePermissionMappingGaurd[]>(
      'permissions',
      context.getHandler(),
    );

    if (!roleAndPermissions) {
      return false;
    }

    const roleAndPermission = roleAndPermissions[0];

    const permissionModule = roleAndPermission.module;
    const operation = roleAndPermission.operations
      ? roleAndPermission.operations[0]
      : null;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (
      user?.role === Roles.ADMIN &&
      roleAndPermission.roles.includes(Roles.ADMIN)
    )
      return true;

    if (
      user?.role === Roles.SUPERADMIN &&
      roleAndPermission.roles.includes(Roles.SUPERADMIN)
    )
      return true;

    if (roleAndPermission.roles.includes(Roles.ROLE_BASED_USER)) {
      if (!operation) return true;
      // get permissions from the role
      const rolePermissions =
        await this.rolePermissionMappingService.findPermissionsByRoleNameAndModule(
          user.role,
          permissionModule,
        );

      console.log(rolePermissions);
      const match = matchPermissions(rolePermissions, operation);

      if (match) return true;

      throw new ForbiddenException(
        `You have no ${operation} permissions for the ${permissionModule}.`,
      );
    }
  }
}

function matchPermissions(permissions: string[], requiredPermissions: string) {
  // check role === admin, or role == super admin
  // if role == user based then check permissions
  return (
    permissions.filter((permission) => permission === requiredPermissions)
      .length > 0
  );
}
