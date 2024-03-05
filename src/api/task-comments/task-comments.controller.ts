import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  Query,
} from '@nestjs/common';
import { TaskCommentsService } from './task-comments.service';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto';
import {
  ApiBearerAuth,
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
} from 'src/common/constants';
import {
  BAD_REQUEST_RESPONSE,
  COMMENT_LISTING,
  GET_COMMENT,
  GET_RESPONSE_SUCCESS,
} from 'src/common/swagger.response';
import {
  Permissions,
  Roles,
} from 'src/common/decorators/permissions.decorator';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { Admin } from '../admin/entities/admin.entity';
import { SuperAdmin } from '../super-admin/entities/super-admin.entity';
import { Users } from '../users/entities/user.entity';

@Controller('api/v1/task-comments')
@ApiTags('Task Comments')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class TaskCommentsController {
  constructor(private readonly taskCommentsService: TaskCommentsService) {}

  /**
   * Add comment
   * @param createTaskCommentDto
   * @param authUser
   * @returns
   */
  @Post()
  @ApiOperation({ summary: 'Add comment' })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async create(
    @Body() createTaskCommentDto: CreateTaskCommentDto,
    @AuthUser() authUser: Admin | SuperAdmin | Users,
  ) {
    const data = await this.taskCommentsService.create(
      createTaskCommentDto,
      authUser,
    );

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'Comment added successfully.',
      data,
    };
  }

  /**
   * Get all comments by task unique id
   * @param authUser
   * @param taskUniqueId
   * @param _page
   * @param _limit
   * @returns
   */
  @Get('/:taskUniqueId')
  @ApiOperation({ summary: 'Get all comments by task' })
  @ApiResponse(COMMENT_LISTING)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async findAll(
    @AuthUser() authUser: Admin | SuperAdmin | Users,
    @Param('taskUniqueId') taskUniqueId: string,
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
  ) {
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 8;

    const { items, meta } = await this.taskCommentsService.findAll(
      authUser,
      taskUniqueId,
      {
        page,
        limit,
      },
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: items,
      meta,
    };
  }

  /**
   * Update comment by comment unique id
   * @param authUser
   * @param commentUniqueId
   * @param updateTaskCommentDto
   * @returns
   */
  @Patch(':commentUniqueId')
  @ApiOperation({ summary: 'Update comment' })
  @ApiResponse(GET_COMMENT)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async update(
    @AuthUser() authUser: Admin | SuperAdmin | Users,
    @Param('commentUniqueId') commentUniqueId: string,
    @Body() updateTaskCommentDto: UpdateTaskCommentDto,
  ) {
    const data = await this.taskCommentsService.update(
      authUser,
      commentUniqueId,
      updateTaskCommentDto,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Comment updated successfully.',
      data,
    };
  }

  /**
   * Delete comment
   * @param authUser
   * @param commentUniqueId
   * @returns
   */
  @Delete(':commentUniqueId')
  @ApiOperation({ summary: 'Delete comment' })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async remove(
    @AuthUser() authUser: Admin | SuperAdmin | Users,
    @Param('commentUniqueId') commentUniqueId: string,
  ) {
    await this.taskCommentsService.remove(authUser, commentUniqueId);

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Comment deleted successfully.',
    };
  }
}
