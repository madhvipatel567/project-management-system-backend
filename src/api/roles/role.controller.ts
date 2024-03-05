import { HTTP_SUCCESS_GET } from '../../common/constants';
import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Get,
  Param,
  Put,
  Delete,
  HttpCode,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiOperation,
  ApiBearerAuth,
  ApiTags,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { HTTP_SUCCESS_POST } from 'src/common/constants';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { EditRoleDto } from './dto/edit-role.dto';
import {
  BAD_REQUEST_RESPONSE,
  CONFLICT_RESPONSE,
  GET_RESPONSE_SUCCESS,
  GET_ROLE,
  POST_REQUEST_SUCCESS,
  ROLE_LISTING,
} from 'src/common/swagger.response';
import { Admin } from '../admin/entities/admin.entity';
import { RoleService } from './role.service';
import { SuperAdmin } from '../super-admin/entities/super-admin.entity';
import { CreateOrUpdateRolePermissionMappingDto } from '../role-permission-mappings/dto/role-permission-mapping.dto';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import {
  Permissions,
  Roles,
} from 'src/common/decorators/permissions.decorator';
import { RoleResource } from './resources/role.resource';
import { RolePermissionsResource } from './resources/role-permissions.resource';

@ApiTags('Roles')
@Controller('api/v1/roles')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class RoleController {
  constructor(private readonly rolesService: RoleService) {}

  /**
   * Listout roles
   * @param authAdmin
   * @returns
   */
  @Get()
  @ApiOperation({ summary: 'Admin: Role list by workspace' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse(ROLE_LISTING)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN],
  })
  async roleList(
    @AuthUser() authAdmin: Admin,
    @Query('workspaceUniqueId') workspaceUniqueId: string,
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
  ) {
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 15;
    const role = await this.rolesService.roleList(
      authAdmin,
      {
        page,
        limit,
      },
      workspaceUniqueId,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: plainToInstance(RoleResource, role.items, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
      meta: role.meta,
    };
  }

  /**
   *  Admin: Get all role lists by workspace
   */
  @Get('/all/:workspaceUniqueId')
  @ApiOperation({ summary: 'Admin: Get all Role list' })
  @ApiResponse(ROLE_LISTING)
  @HttpCode(HTTP_SUCCESS_GET)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Permissions({
    roles: [Roles.ADMIN],
  })
  async roleAllList(
    @AuthUser() authAdmin: Admin,
    @Param('workspaceUniqueId') workspaceUniqueId: string,
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
  ) {
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 15;
    const role = await this.rolesService.roleAllList(
      authAdmin,
      workspaceUniqueId,
      {
        page,
        limit,
      },
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: plainToInstance(RoleResource, role.items, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
      meta: role.meta,
    };
  }

  /**
   * SuperAdmin: Listout roles
   * @param authAdmin
   * @returns
   */
  @Get('/workspace/:workspaceUniqueId')
  @ApiOperation({ summary: 'SuperAdmin: Role list by workspaces' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse(ROLE_LISTING)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.SUPERADMIN],
  })
  async roleListBySuperAdmin(
    @AuthUser() superAdmin: SuperAdmin,
    @Param('workspaceUniqueId') workspaceUniqueId: string,
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
    @Query('search') search?: string,
  ) {
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 15;
    const role = await this.rolesService.roleListByWorkspaces(
      superAdmin,
      {
        page,
        limit,
      },
      workspaceUniqueId,
      search,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: plainToInstance(RoleResource, role.items, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
      meta: role.meta,
    };
  }

  /**
   * Authorize roles
   * @param roleUniqueId
   * @returns
   */
  @Put('/authorize/:roleUniqueId')
  @ApiOperation({ summary: 'Authorize role' })
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.SUPERADMIN],
  })
  async roleAuthorize(
    @AuthUser() superAdmin: SuperAdmin,
    @Param('roleUniqueId') roleUniqueId: string,
  ) {
    await this.rolesService.roleAuthorize(roleUniqueId, superAdmin);

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Role has been sucessfully authorized.',
    };
  }

  /**
   * create role
   * @param authAdmin
   * @param createRoleDto
   * @returns
   */
  @Post()
  @ApiOperation({
    summary: 'Create role',
  })
  @ApiResponse(POST_REQUEST_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @Permissions({
    roles: [Roles.ADMIN],
  })
  async createRole(
    @AuthUser() authAdmin: Admin,
    @Body() createRoleDto: CreateRoleDto,
  ) {
    await this.rolesService.createRole(authAdmin, createRoleDto);
    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'Role successfully created',
    };
  }

  /**
   * get role by id
   * @param id
   * @returns
   */
  @Get('/:roleUniqueId')
  @ApiOperation({
    summary: 'Get role',
  })
  @UsePipes(ValidationPipe)
  @ApiResponse(GET_ROLE)
  @ApiResponse(CONFLICT_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN],
  })
  async getRole(@Param('roleUniqueId') roleUniqueId: string) {
    const role = await this.rolesService.getRole(roleUniqueId);

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: plainToInstance(RoleResource, role, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Edit role by role unique id
   * @param editRoleDto
   * @param authAdmin
   * @param id
   * @returns
   */
  @Put('/:roleUniqueId')
  @ApiOperation({
    summary: 'Edit role',
  })
  @ApiResponse(CONFLICT_RESPONSE)
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @HttpCode(HTTP_SUCCESS_GET)
  @UsePipes(ValidationPipe)
  @Permissions({
    roles: [Roles.ADMIN],
  })
  async editRole(
    @Body() editRoleDto: EditRoleDto,
    @AuthUser() authAdmin: Admin,
    @Param('roleUniqueId') roleUniqueId: string,
  ) {
    await this.rolesService.editRole(editRoleDto, authAdmin, roleUniqueId);

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Role successfully updated.',
    };
  }

  /**
   * Delete role by role unique id
   * @param id
   * @returns
   */
  @Delete('/:roleUniqueId')
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(CONFLICT_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @UsePipes(ValidationPipe)
  @Permissions({
    roles: [Roles.ADMIN],
  })
  async deleteRole(@Param('roleUniqueId') roleUniqueId: string) {
    await this.rolesService.deleteRole(roleUniqueId);

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Role successfully deleted.',
    };
  }

  /**
   * Listout permissions by role unique id
   * @param authAdmin
   * @returns
   */
  @Get('/:roleUniqueId/permissions')
  @ApiOperation({ summary: 'Permissions by Role' })
  @ApiResponse(ROLE_LISTING)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN],
  })
  async getPermissionsByRole(
    @AuthUser() superAdmin: SuperAdmin,
    @Param('roleUniqueId') roleUniqueId: string,
  ) {
    const data = await this.rolesService.getPermissionsByRole(
      superAdmin,
      roleUniqueId,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: plainToInstance(RolePermissionsResource, data, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Update permissions
   * @param authAdmin
   * @returns
   */
  @Put('/:roleUniqueId/permissions')
  @ApiOperation({ summary: 'Update permissions by Role' })
  @ApiResponse(ROLE_LISTING)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN],
  })
  async UpdatePermissionsByRole(
    @AuthUser() admin: Admin,
    @Param('roleUniqueId') roleUniqueId: string,
    @Body()
    createOrUpdateRolePermissionMappingDto: CreateOrUpdateRolePermissionMappingDto,
  ) {
    const data = await this.rolesService.updatePermissionsByRole(
      admin,
      roleUniqueId,
      createOrUpdateRolePermissionMappingDto,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Permissions successfully saved.',
      data: plainToInstance(RolePermissionsResource, data, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
    };
  }
}
