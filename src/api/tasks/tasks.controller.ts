import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  UseInterceptors,
  UploadedFiles,
  Query,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
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
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import {
  Permissions,
  Roles,
} from 'src/common/decorators/permissions.decorator';
import { IUploadedFile } from 'src/common/interfaces/uploaded-file.interface';
import {
  BAD_REQUEST_RESPONSE,
  GET_RESPONSE_SUCCESS,
  POST_REQUEST_SUCCESS,
  SUBTASKS,
  TASK_CREATE_SUCCESS,
  TASK_DETAIL,
  TASK_KANBAN_VIEW,
  TASK_KANBAN_VIEW_PAGINATION,
} from 'src/common/swagger.response';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { Admin } from '../admin/entities/admin.entity';
import { SuperAdmin } from '../super-admin/entities/super-admin.entity';
import { Users } from '../users/entities/user.entity';
import { ImportTaskDto } from './dto/import-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';

@Controller('api/v1/tasks')
@ApiTags('Tasks')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * Create tasks
   * @param createTaskDto
   * @param attachments
   * @returns
   */
  @Post()
  @ApiOperation({ summary: 'Create task' })
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
    @Body() createTaskDto: CreateTaskDto,
    @AuthUser() authUser: Admin | SuperAdmin | Users,
    @UploadedFiles() attachments?: IUploadedFile[],
  ) {
    const task = await this.tasksService.create(
      createTaskDto,
      authUser,
      attachments,
    );

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: createTaskDto.parentTaskUniqueId
        ? 'Subtask created successfully.'
        : 'Task created successfully.',
      data: {
        taskUniqueId: task.taskUniqueId,
      },
    };
  }

  /**
   * Kanban view for task listing
   * @param authUser
   * @param _page
   * @param _limit
   * @param search
   * @param workspaceUniqueId
   * @returns
   */
  @Get('/kanban')
  @ApiOperation({ summary: 'Listout tasks for Kanban view' })
  @ApiQuery({
    name: 'search',
    required: false,
  })
  @ApiQuery({
    name: 'workspaceUniqueId',
    required: false,
  })
  @ApiResponse(TASK_KANBAN_VIEW)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.READ],
    module: PermissionModules.TASK_MODULE,
  })
  async findAllTasksKanbanList(
    @AuthUser() authUser: SuperAdmin | Admin | Users,
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
    @Query('search') search?: string,
    @Query('workspaceUniqueId') workspaceUniqueId?: string,
    @Query() filterTaskDto?: FilterTaskDto,
  ) {
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 8;
    const data = await this.tasksService.findAllTasksKanbanList(
      authUser,
      {
        page,
        limit,
      },
      search,
      workspaceUniqueId,
      filterTaskDto,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: data,
    };
  }

  /**
   * Kanban view for task listing
   * @param authUser
   * @param _page
   * @param _limit
   * @param search
   * @param workspaceUniqueId
   * @returns
   */
  @Get('/kanban/pagination')
  @ApiOperation({ summary: 'Listout tasks for Kanban view - pagination' })
  @ApiQuery({
    name: 'search',
    required: false,
  })
  @ApiQuery({
    name: 'workspaceUniqueId',
    required: false,
  })
  @ApiResponse(TASK_KANBAN_VIEW_PAGINATION)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.READ],
    module: PermissionModules.TASK_MODULE,
  })
  async findAllTasksKanbanPaginationList(
    @AuthUser() authUser: SuperAdmin | Admin | Users,
    @Query('status') status: string,
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
    @Query('search') search?: string,
    @Query('workspaceUniqueId') workspaceUniqueId?: string,
    @Query() filterTaskDto?: FilterTaskDto,
  ) {
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 8;
    const data = await this.tasksService.findAllTasksKanbanPaginationList(
      authUser,
      {
        page,
        limit,
      },
      search,
      workspaceUniqueId,
      status,
      filterTaskDto,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      ...data,
    };
  }

  @Get('/:taskUniqueId')
  @ApiResponse(TASK_DETAIL)
  @ApiOperation({ summary: 'Task detail by taskUniqueId' })
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.READ],
    module: PermissionModules.TASK_MODULE,
  })
  async getTask(
    @Param('taskUniqueId') taskUniqueId: string,
    @AuthUser() authUser: SuperAdmin | Admin | Users,
  ) {
    const data = await this.tasksService.getTask(taskUniqueId, authUser);

    return {
      statusCode: HTTP_SUCCESS_GET,
      data,
    };
  }

  /**
   * Duplicate tasks
   * @param authUser
   * @param taskUniqueId
   * @returns
   */
  @Get('/:taskUniqueId/duplicate')
  @ApiResponse(TASK_CREATE_SUCCESS)
  @ApiOperation({ summary: 'Task duplicate by taskUniqueId' })
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.READ],
    module: PermissionModules.TASK_MODULE,
  })
  @ApiQuery({
    name: 'isSubtask',
    required: false,
    example: true,
  })
  async duplicateTask(
    @AuthUser() authUser: SuperAdmin | Admin | Users,
    @Param('taskUniqueId') taskUniqueId: string,
    @Query('isSubtask') isSubtask?: boolean,
  ) {
    const task = await this.tasksService.duplicateTask(
      authUser,
      taskUniqueId,
      isSubtask,
      false,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Task created successfully.',
      data: {
        taskUniqueId: task.taskUniqueId,
      },
    };
  }

  /**
   * Get subtask listing
   * @param taskUniqueId
   * @param _page
   * @param _limit
   * @param search
   * @returns
   */
  @Get('/team/:teamUniqueId')
  @ApiOperation({ summary: 'Team wise task listing by teamUniqueId' })
  @ApiQuery({
    name: 'isAssigned',
    required: false,
    example: true,
  })
  @ApiQuery({
    name: 'isInProgress',
    required: false,
    example: true,
  })
  @ApiQuery({
    name: 'isDue',
    required: false,
    example: true,
  })
  @ApiQuery({
    name: 'isCompleted',
    required: false,
    example: true,
  })
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async getTasksByTeam(
    @Param('teamUniqueId') teamUniqueId: string,
    @Query('isAssigned') isAssigned?: string,
    @Query('isDue') isDue?: string,
    @Query('isInProgress') isInProgress?: string,
    @Query('isCompleted') isCompleted?: string,
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
  ) {
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 10000000000;
    const data = await this.tasksService.getTasksByTeam(
      teamUniqueId,
      isAssigned,
      isDue,
      isInProgress,
      isCompleted,
      {
        page,
        limit,
      },
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: data.items,
      meta: data.meta,
    };
  }

  /**
   * Get subtask listing
   * @param taskUniqueId
   * @param _page
   * @param _limit
   * @param search
   * @returns
   */
  @Get('/:taskUniqueId/subtasks')
  @ApiResponse(SUBTASKS)
  @ApiOperation({ summary: 'Subtask listing by taskUniqueId' })
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.READ],
    module: PermissionModules.TASK_MODULE,
  })
  async getSubTasks(
    @Param('taskUniqueId') taskUniqueId: string,
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
  ) {
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 8;
    const data = await this.tasksService.getSubTasks(taskUniqueId, {
      page,
      limit,
    });

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: data.items,
      meta: data.meta,
    };
  }

  /**
   * Import tasks within workspaces
   * @param importUserDto
   * @param csvFile
   * @returns
   */
  @Post('/import')
  @ApiOperation({ summary: 'Create tasks by importing csv' })
  @ApiResponse(POST_REQUEST_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @UseInterceptors(FileInterceptor('csvFile'))
  @ApiConsumes('multipart/form-data')
  @Permissions({
    roles: [Roles.ADMIN, Roles.ROLE_BASED_USER, Roles.SUPERADMIN],
    operations: [Operations.CREATE],
    module: PermissionModules.TASK_MODULE,
  })
  async importAndCreateTasks(
    @AuthUser() authUser: Admin | Users | SuperAdmin,
    @Body() importTaskDto: ImportTaskDto,
    @UploadedFile() csvFile: Multer.File,
  ) {
    const data = await this.tasksService.importAndCreateTasks(
      authUser,
      csvFile,
      importTaskDto,
    );

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: data === true ? 'Task successfully created' : null,
      data,
    };
  }

  /**
   * Import tasks within workspaces v2
   * @param importUserDto
   * @param csvFile
   * @returns
   */
  @Post('/import-v2')
  @ApiOperation({ summary: 'Create tasks by importing csv' })
  @ApiResponse(POST_REQUEST_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @UseInterceptors(FileInterceptor('csvFile'))
  @ApiConsumes('multipart/form-data')
  @Permissions({
    roles: [Roles.ADMIN, Roles.ROLE_BASED_USER, Roles.SUPERADMIN],
    operations: [Operations.CREATE],
    module: PermissionModules.TASK_MODULE,
  })
  async importAndCreateTasksV2(
    @AuthUser() authUser: Admin | Users | SuperAdmin,
    @Body() importTaskDto: ImportTaskDto,
    @UploadedFile() csvFile: Multer.File,
  ) {
    const data = await this.tasksService.importAndCreateTasksV2(
      authUser,
      csvFile,
      importTaskDto,
    );

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: data === true ? 'Task successfully created' : null,
      data,
    };
  }

  /**
   * Update task
   * @param authUser
   * @param updateTaskDto
   * @param taskUniqueId
   * @param attachments
   * @returns
   */
  @Post('/:taskUniqueId')
  @ApiResponse(TASK_DETAIL)
  @ApiOperation({ summary: 'Edit task by taskUniqueId' })
  @HttpCode(HTTP_SUCCESS_GET)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attachments'))
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.UPDATE],
    module: PermissionModules.TASK_MODULE,
  })
  async updateTask(
    @AuthUser() authUser: Users,
    @Body() updateTaskDto: UpdateTaskDto,
    @Param('taskUniqueId') taskUniqueId: string,
    @UploadedFiles() attachments?: IUploadedFile[],
  ) {
    const data = await this.tasksService.updateTask(
      authUser,
      updateTaskDto,
      taskUniqueId,
      attachments,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: data.parent
        ? 'Subtask updated successfully.'
        : 'Task updated successfully.',
    };
  }

  /**
   * Delete task
   * @param taskUniqueId
   * @returns
   */
  @Permissions({
    roles: [Roles.SUPERADMIN, Roles.ADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.DELETE],
    module: PermissionModules.TASK_MODULE,
  })
  @Delete(':taskUniqueId')
  @HttpCode(HTTP_SUCCESS_GET)
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  async remove(@Param('taskUniqueId') taskUniqueId: string) {
    const data = await this.tasksService.remove(taskUniqueId);
    return {
      statusCode: HTTP_SUCCESS_GET,
      message: data.parent
        ? 'Subtask deleted successfully.'
        : 'Task deleted successfully.',
    };
  }

  /**
   * Notify task
   * @param taskUniqueId
   * @returns
   */
  @Permissions({
    roles: [Roles.SUPERADMIN, Roles.ADMIN, Roles.ROLE_BASED_USER],
    module: PermissionModules.TASK_MODULE,
  })
  @Get(':taskUniqueId/notify')
  @HttpCode(HTTP_SUCCESS_GET)
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  async notifyTask(@Param('taskUniqueId') taskUniqueId: string) {
    await this.tasksService.notifyTask(taskUniqueId);
    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Email sent successfully',
    };
  }

  /**
   * export Tasks
   * @param res
   * @param workspaceUniqueId
   * @returns
   */
  @Get('export/:workspaceUniqueId')
  @ApiOperation({ summary: 'Export tasks details' })
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async exportTasks(
    @Res({ passthrough: true }) res: Response,
    @Param('workspaceUniqueId') workspaceUniqueId: string,
  ): Promise<StreamableFile> {
    const exportTasksDetails = await this.tasksService.exportTasksDetails(
      workspaceUniqueId,
    );

    res.set({
      'Content-Type': exportTasksDetails.fileType,
      'Content-Disposition': `attachment; filename=${exportTasksDetails.fileName}`,
    });

    return new StreamableFile(exportTasksDetails.file);
  }

  /**
   * upcoming task reports listing
   * @param authUser
   * @param _page
   * @param _limit
   * @param search
   * @param workspaceUniqueId
   * @returns
   */
  @Get('/reports/upcoming-tasks')
  @ApiOperation({ summary: 'Listout upcoming tasks reports' })
  @ApiQuery({
    name: 'search',
    required: false,
  })
  @ApiQuery({
    name: 'workspaceUniqueId',
    required: true,
  })
  @ApiResponse(TASK_KANBAN_VIEW)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.READ],
    module: PermissionModules.TASK_MODULE,
  })
  async upcomingTaskReports(
    @AuthUser() authUser: SuperAdmin | Admin | Users,
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
    @Query('search') search?: string,
    @Query('workspaceUniqueId') workspaceUniqueId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 15;
    const [data, total] = await this.tasksService.upcomingTaskReports(
      authUser,
      {
        page,
        limit,
      },
      search,
      workspaceUniqueId,
      startDate,
      endDate,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: data,
      meta: {
        totalItems: total.length,
        itemsPerPage: limit ? Number(limit) : 15,
        totalPages: limit ? Math.ceil(total.length / limit) : 1,
        currentPage: page ? Number(page) : 1,
      },
    };
  }

  /**
   * all task reports listing
   * @param authUser
   * @param _page
   * @param _limit
   * @param search
   * @param workspaceUniqueId
   * @returns
   */
  @Get('/reports/all-tasks')
  @ApiOperation({ summary: 'Listout all tasks reports' })
  @ApiQuery({
    name: 'search',
    required: false,
  })
  @ApiQuery({
    name: 'workspaceUniqueId',
    required: true,
  })
  @ApiResponse(TASK_KANBAN_VIEW)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.READ],
    module: PermissionModules.TASK_MODULE,
  })
  async allTaskReports(
    @AuthUser() authUser: SuperAdmin | Admin | Users,
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
    @Query('search') search?: string,
    @Query('workspaceUniqueId') workspaceUniqueId?: string,
  ) {
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 15;
    const [data, total] = await this.tasksService.allTaskReports(
      authUser,
      {
        page,
        limit,
      },
      search,
      workspaceUniqueId,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: data,
      meta: {
        totalItems: total.length,
        itemsPerPage: limit ? Number(limit) : 15,
        totalPages: limit ? Math.ceil(total.length / limit) : 1,
        currentPage: page ? Number(page) : 1,
      },
    };
  }
}
