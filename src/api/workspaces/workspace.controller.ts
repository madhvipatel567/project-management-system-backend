import { HTTP_SUCCESS_POST, HTTP_SUCCESS_GET } from './../../common/constants';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Get,
  UseInterceptors,
  UploadedFile,
  Put,
  Delete,
  Param,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateWorkspaceDto } from '../workspaces/dto/create-workspace.dto';
import { Multer } from 'multer';
import { WorkspaceResource } from '../workspaces/resources/workspace.resource';
import { EditWorkspaceDto } from '../workspaces/dto/edit-workspace.dto';
import {
  BAD_REQUEST_RESPONSE,
  CONFLICT_RESPONSE,
  GET_RESPONSE_SUCCESS,
  GET_WORKSPACE,
  POST_REQUEST_SUCCESS,
  WORKSPACE_LIST,
} from 'src/common/swagger.response';
import { WorkspaceService } from './workspace.service';
import { SuperAdmin } from '../super-admin/entities/super-admin.entity';
import { Admin } from '../admin/entities/admin.entity';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import {
  Permissions,
  Roles,
} from 'src/common/decorators/permissions.decorator';

@ApiTags('Workspaces')
@Controller('api/v1/workspaces')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class WorkspacesController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  /**
   * workspace list
   * @param authSuperAdmin
   * @returns
   */
  @Get()
  @ApiOperation({
    summary: 'Workspace list',
  })
  @ApiResponse(WORKSPACE_LIST)
  @ApiQuery({ name: 'adminUniqueId', required: false, type: 'string' })
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN],
  })
  async workspaceList(
    @AuthUser() authSuperAdmin: SuperAdmin,
    @Query('adminUniqueId') adminUniqueId: string,
  ) {
    const workspace = await this.workspaceService.workspaceList(
      authSuperAdmin,
      adminUniqueId,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: plainToInstance(WorkspaceResource, workspace, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * workspace list
   * @param authSuperAdmin
   * @returns
   */
  @Get('list-by-admin')
  @ApiOperation({
    summary: 'Admin: Workspace list',
  })
  @ApiResponse(WORKSPACE_LIST)
  @Permissions({
    roles: [Roles.ADMIN],
  })
  @HttpCode(HTTP_SUCCESS_GET)
  async workspaceListByAdmin(@AuthUser() admin: Admin) {
    const workspace = await this.workspaceService.workspaceListByAdmin(admin);

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: plainToInstance(WorkspaceResource, workspace, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * create workspace
   * @param createWorkspaceDto
   * @param authSuperAdmin
   * @param image
   * @returns
   */
  @Post('')
  @ApiOperation({ summary: 'Create workspace' })
  @ApiResponse(POST_REQUEST_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @UsePipes(ValidationPipe)
  @ApiQuery({ name: 'adminIds', required: false, type: 'string' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @Permissions({
    roles: [Roles.SUPERADMIN],
  })
  async createWorkspace(
    @Query('adminIds') adminIds: string,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @AuthUser() authSuperAdmin: SuperAdmin,
    @UploadedFile() image: Array<Multer.File>,
  ) {
    const workspace = await this.workspaceService.createWorkspace(
      adminIds,
      createWorkspaceDto,
      authSuperAdmin,
      image,
    );

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'Workspace successfully created',
      workspaceUniqueId: workspace.workspaceUniqueId,
    };
  }

  /**
   * Get workspace by ID
   * @param workspaceUniqueId
   * @returns
   */
  @Get('/:workspaceUniqueId')
  @ApiOperation({ summary: 'Get workspace' })
  @ApiResponse(GET_WORKSPACE)
  @ApiResponse(CONFLICT_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @UsePipes(ValidationPipe)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN],
  })
  async getWorkspace(@Param('workspaceUniqueId') workspaceUniqueId: string) {
    const workspace = await this.workspaceService.getWorkspace(
      workspaceUniqueId,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: plainToInstance(WorkspaceResource, workspace, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Edit workspace
   * @param editWorkspaceDto
   * @param authSuperAdmin
   * @param image
   * @param id
   * @returns
   */
  @Put('/:workspaceUniqueId')
  @ApiOperation({
    summary: 'Edit workspace',
  })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(CONFLICT_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @UsePipes(ValidationPipe)
  @ApiConsumes('multipart/form-data')
  @Permissions({
    roles: [Roles.SUPERADMIN],
  })
  @UseInterceptors(FileInterceptor('image'))
  async editWorkspace(
    @Body() editWorkspaceDto: EditWorkspaceDto,
    @AuthUser() authSuperAdmin: SuperAdmin,
    @UploadedFile() image: Array<Multer.File>,
    @Param('workspaceUniqueId') workspaceUniqueId: string,
  ) {
    await this.workspaceService.editWorkspace(
      editWorkspaceDto,
      authSuperAdmin,
      image,
      workspaceUniqueId,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Workspace successfully updated',
    };
  }

  /**
   * Delete workspace by workspace ID
   * @param id
   * @returns
   */
  @Delete('/:workspaceUniqueId')
  @ApiOperation({ summary: 'Delete workspace' })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(CONFLICT_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @UsePipes(ValidationPipe)
  @Permissions({
    roles: [Roles.SUPERADMIN],
  })
  async deleteWorkspace(@Param('workspaceUniqueId') workspaceUniqueId: string) {
    await this.workspaceService.deleteWorkspace(workspaceUniqueId);

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Workspace successfully deleted',
    };
  }
}
