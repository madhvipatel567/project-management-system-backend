import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TaskAttachmentsService } from './task-attachments.service';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import {
  HTTP_SUCCESS_GET,
  HTTP_SUCCESS_POST,
  Operations,
  PermissionModules,
} from 'src/common/constants';
import {
  Permissions,
  Roles,
} from 'src/common/decorators/permissions.decorator';
import {
  BAD_REQUEST_RESPONSE,
  GET_RESPONSE_SUCCESS,
  TASK_CREATE_SUCCESS,
} from 'src/common/swagger.response';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Admin } from '../admin/entities/admin.entity';
import { SuperAdmin } from '../super-admin/entities/super-admin.entity';
import { Users } from '../users/entities/user.entity';
import { IUploadedFile } from 'src/common/interfaces/uploaded-file.interface';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { CreateTaskAttachmentDto } from './dto/create-task-attachment.dto';

@Controller('api/v1/task-attachments')
@ApiTags('Task Attachments')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class TaskAttachmentsController {
  constructor(
    private readonly taskAttachmentsService: TaskAttachmentsService,
  ) {}

  /**
   * Create tasks attachments
   * @param createTaskDto
   * @param attachments
   * @returns
   */
  @Post()
  @ApiOperation({ summary: 'Store task completed attachments' })
  @ApiResponse(TASK_CREATE_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attachments'))
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.CREATE],
    module: PermissionModules.TASK_MODULE,
  })
  async create(
    @Body() createTaskAttachmentDto: CreateTaskAttachmentDto,
    @AuthUser() authUser: Admin | SuperAdmin | Users,
    @UploadedFiles() attachments?: IUploadedFile[],
  ) {
    const data = await this.taskAttachmentsService.create(
      createTaskAttachmentDto,
      authUser,
      attachments,
    );

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'Attachement uploaded successfully.',
      data,
    };
  }

  /**
   * Delete attachment
   * @param attachmentUniqueId
   * @returns
   */
  @Permissions({
    roles: [Roles.SUPERADMIN, Roles.ADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.UPDATE],
    module: PermissionModules.TASK_MODULE,
  })
  @Delete(':attachmentUniqueId')
  @HttpCode(HTTP_SUCCESS_GET)
  @ApiResponse(GET_RESPONSE_SUCCESS)
  async remove(
    @AuthUser() authUser: Admin | SuperAdmin | Users,
    @Param('attachmentUniqueId') attachmentUniqueId: string,
  ) {
    await this.taskAttachmentsService.remove(authUser, attachmentUniqueId);
    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Attachement deleted',
    };
  }
}
