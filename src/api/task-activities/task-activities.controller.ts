import {
  Controller,
  Get,
  HttpCode,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HTTP_SUCCESS_GET } from 'src/common/constants';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import {
  Permissions,
  Roles,
} from 'src/common/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { BAD_REQUEST_RESPONSE } from 'src/common/swagger.response';
import { Admin } from '../admin/entities/admin.entity';
import { SuperAdmin } from '../super-admin/entities/super-admin.entity';
import { Users } from '../users/entities/user.entity';
import { TaskActivitiesService } from './task-activities.service';

@Controller('api/v1/activities')
@ApiTags('Task Activities')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class TaskActivitiesController {
  constructor(private readonly taskActivitiesService: TaskActivitiesService) {}

  /**
   * Get all comments by task unique id
   * @param authUser
   * @param taskUniqueId
   * @param _page
   * @param _limit
   * @returns
   */
  @Get('/task/:taskUniqueId')
  @ApiOperation({ summary: 'Get all activities by task' })
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

    const { items, meta } = await this.taskActivitiesService.findAll(
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
}
