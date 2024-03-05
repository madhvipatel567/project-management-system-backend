import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UsePipes,
  HttpCode,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { HTTP_SUCCESS_GET } from 'src/common/constants';
import {
  Permissions,
  Roles,
} from 'src/common/decorators/permissions.decorator';
import {
  CONFLICT_RESPONSE,
  GET_RESPONSE_SUCCESS,
} from 'src/common/swagger.response';
import { DashboardService } from './dashboard.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { DashboardResource } from './resources/dashboard.resource';

@ApiTags('Dashboard')
@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * get dashboard data
   * @returns
   */
  @Get('/:workspaceUniqueId')
  @ApiOperation({
    summary: 'Get dashboard data',
  })
  @UsePipes(ValidationPipe)
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(CONFLICT_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN],
  })
  async getDashboardData(
    @Param('workspaceUniqueId') workspaceUniqueId: string,
  ) {
    const dashboard = await this.dashboardService.getDashboardData(
      workspaceUniqueId,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: plainToInstance(DashboardResource, dashboard, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
    };
  }
}
