import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Query,
  Put,
  Param,
  Delete,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  BAD_REQUEST_RESPONSE,
  POST_REQUEST_SUCCESS,
  GET_RESPONSE_SUCCESS,
  ROLE_LISTING,
} from 'src/common/swagger.response';
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
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { Admin } from '../admin/entities/admin.entity';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { plainToInstance } from 'class-transformer';
import { TeamResource } from './resources/team.resource';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Users } from '../users/entities/user.entity';

@ApiTags('Teams')
@Controller('api/v1/teams')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  /**
   * create team
   * @param createTeamDto
   * @param authAdmin
   * @returns
   */
  @Post()
  @ApiOperation({
    summary: 'Create team',
  })
  @ApiResponse(POST_REQUEST_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @Permissions({
    roles: [Roles.ADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.CREATE],
    module: PermissionModules.TEAM_MODULE,
  })
  async create(
    @Body() createTeamDto: CreateTeamDto,
    @AuthUser() authAdmin: Admin | Users,
  ) {
    await this.teamsService.createTeam(authAdmin, createTeamDto);
    return {
      statusCode: HTTP_SUCCESS_POST,
      message: createTeamDto.isDuplicate
        ? 'Successfully duplicate the team'
        : 'Team successfully created',
    };
  }

  /**
   * update team
   * @param updateTeamDto
   * @param authAdmin
   * @returns
   */
  @Put('/:teamUniqueId')
  @ApiOperation({
    summary: 'Update team',
  })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.UPDATE],
    module: PermissionModules.TEAM_MODULE,
  })
  async update(
    @Param('teamUniqueId') teamUniqueId: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @AuthUser() authAdmin: Admin,
  ) {
    await this.teamsService.updateTeam(teamUniqueId, authAdmin, updateTeamDto);
    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Team successfully updated',
    };
  }

  /**
   * delete team
   * @param updateTeamDto
   * @param authAdmin
   * @returns
   */
  @Delete('/:teamUniqueId')
  @ApiOperation({
    summary: 'Delete team',
  })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.DELETE],
    module: PermissionModules.TEAM_MODULE,
  })
  async delete(
    @Param('teamUniqueId') teamUniqueId: string,
    @AuthUser() authAdmin: Admin,
  ) {
    await this.teamsService.deleteTeam(teamUniqueId, authAdmin);
    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Team successfully deleted',
    };
  }

  /**
   * Get teams by workspaces
   * @param authAdmin
   * @param workspaceUniqueId
   * @param _page
   * @param _limit
   * @param search
   * @returns
   */
  @Get()
  @ApiOperation({ summary: 'Team list by workspace' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse(ROLE_LISTING)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async teamList(
    @AuthUser() authAdmin: Admin,
    @Query('workspaceUniqueId') workspaceUniqueId: string,
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
    @Query('search') search?: string,
  ) {
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 15;
    const team = await this.teamsService.teamList(
      authAdmin,
      workspaceUniqueId,
      page,
      limit,
      search,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: plainToInstance(TeamResource, team.data, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
      meta: team.meta,
    };
  }

  /**
   * Get teams by workspaces
   * @param authAdmin
   * @param workspaceUniqueId
   * @param _page
   * @param _limit
   * @param search
   * @returns
   */
  @Get('/:teamUniqueId')
  @ApiOperation({ summary: 'Team details by team unique id' })
  @ApiResponse(ROLE_LISTING)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async getTeamByUniqueId(@Param('teamUniqueId') teamUniqueId: string) {
    const team = await this.teamsService.getTeam(teamUniqueId);

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: team,
    };
  }

  /**
   * Get teams reports by workspaces
   * @param workspaceUniqueId
   * @param _page
   * @param _limit
   * @param search
   * @returns
   */
  @Get('/reports/workspace/:workspaceUniqueId')
  @ApiOperation({ summary: 'Team reports by workspace unique id' })
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getTeamReportsByWorkspace(
    @Param('workspaceUniqueId') workspaceUniqueId: string,
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
    @Query('search') search?: string,
  ) {
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 1000000000;
    const data = await this.teamsService.getTeamReportsByWorkspace(
      workspaceUniqueId,
      page,
      limit,
      search,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: data.data,
      meta: data.meta,
    };
  }

  /**
   * export teams
   * @param res
   * @param workspaceUniqueId
   * @returns
   */
  @Get('export/:workspaceUniqueId')
  @ApiOperation({ summary: 'Export team details' })
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async exportTeams(
    @Res({ passthrough: true }) res: Response,
    @Param('workspaceUniqueId') workspaceUniqueId: string,
  ): Promise<StreamableFile> {
    const exportTeamDetails = await this.teamsService.exportTeamDetails(
      workspaceUniqueId,
    );

    res.set({
      'Content-Type': exportTeamDetails.fileType,
      'Content-Disposition': `attachment; filename=${exportTeamDetails.fileName}`,
    });

    return new StreamableFile(exportTeamDetails.file);
  }
}
