import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { classToPlain, plainToInstance } from 'class-transformer';
import { HTTP_SUCCESS_GET } from 'src/common/constants';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import {
  Permissions,
  Roles,
} from 'src/common/decorators/permissions.decorator';
import { castToStorage } from 'src/common/helper/fileupload.helper';
import { Users } from '../users/entities/user.entity';
import { UserRolePermissionsResource } from './resources/user-role-permissions.resource';
import { RolePermissionMappingService } from './role-permission-mapping..service';

@ApiTags('Role Permissions Mapping')
@Controller('api/v1/role-permissions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class RolePermissionMappingController {
  constructor(
    private readonly rolePermissionMappingService: RolePermissionMappingService,
  ) {}

  /**
   * Get all permissions by role
   * @param authUser
   * @returns
   */
  @Get('by-user')
  @ApiOperation({ summary: 'Get role permissions' })
  @Permissions({
    roles: [Roles.ROLE_BASED_USER],
  })
  @HttpCode(HTTP_SUCCESS_GET)
  async findAll(@AuthUser() authUser: Users) {
    const user = classToPlain(authUser);
    const { rolePermissions, workspace } =
      await this.rolePermissionMappingService.findPermissionsByRoleName(
        user.role,
        user.userUniqueId,
      );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: {
        permissions: plainToInstance(
          UserRolePermissionsResource,
          rolePermissions,
          {
            enableImplicitConversion: true,
            excludeExtraneousValues: true,
          },
        ),
        workspace: {
          id: Number(workspace.id),
          workspaceUniqueId: workspace.workspaceUniqueId,
          workspaceName: workspace.workspaceName,
          image: workspace.image ? castToStorage(workspace.image) : null,
        },
      },
    };
  }
}
