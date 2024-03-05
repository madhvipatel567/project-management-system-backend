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
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HTTP_SUCCESS_GET, HTTP_SUCCESS_POST } from 'src/common/constants';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import {
  Permissions,
  Roles,
} from 'src/common/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import {
  BAD_REQUEST_RESPONSE,
  CLASS_LISTING,
  GET_RESPONSE_SUCCESS,
} from 'src/common/swagger.response';
import { SuperAdmin } from '../super-admin/entities/super-admin.entity';
import { Users } from '../users/entities/user.entity';
import { ClassesAndDivisionsService } from './classes-and-divisions.service';
import { CreateClassesAndDivisionDto } from './dto/create-classes-and-division.dto';
import { UpdateClassesAndDivisionDto } from './dto/update-classes-and-division.dto';

@Controller('api/v1/classes-and-divisions')
@ApiTags('Classes & Divisions')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class ClassesAndDivisionsController {
  constructor(
    private readonly classesAndDivisionsService: ClassesAndDivisionsService,
  ) {}

  /**
   * Create class and divisions
   * @param createClassesAndDivisionDto
   * @returns
   */
  @Post('/:workspaceUniqueId')
  @ApiOperation({ summary: 'Add Classes' })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @Permissions({
    roles: [Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async create(
    @AuthUser() authUser: Users | SuperAdmin,
    @Body() createClassesAndDivisionDto: CreateClassesAndDivisionDto,
    @Param('workspaceUniqueId') workspaceUniqueId: string,
  ) {
    await this.classesAndDivisionsService.create(
      authUser,
      createClassesAndDivisionDto,
      workspaceUniqueId,
    );

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'Class successfully created',
    };
  }

  /**
   * Duplicate class and divisions
   * @returns
   */
  @Get('/duplicate/:classUniqueId')
  @ApiOperation({ summary: 'Duplicate Classes' })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async duplicate(
    @AuthUser() authUser: Users | SuperAdmin,
    @Param('classUniqueId') classUniqueId: string,
  ) {
    await this.classesAndDivisionsService.duplicate(authUser, classUniqueId);

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Class successfully duplicated',
    };
  }

  /**
   * Get all the classes by workspace
   * @param authUser
   * @param workspaceUniqueId
   * @param _page
   * @param _limit
   * @returns
   */
  @Get('/:workspaceUniqueId')
  @ApiOperation({ summary: 'Get classes by workspaces' })
  @HttpCode(HTTP_SUCCESS_GET)
  @ApiResponse(CLASS_LISTING)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @Permissions({
    roles: [Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async findAll(
    @AuthUser() authUser: Users | SuperAdmin,
    @Param('workspaceUniqueId') workspaceUniqueId: string,
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
  ) {
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 15;
    const { items: data, meta } = await this.classesAndDivisionsService.findAll(
      authUser,
      {
        page,
        limit,
      },
      workspaceUniqueId,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data,
      meta,
    };
  }

  /**
   * Update class by class unique ID
   * @param classUniqueId
   * @param updateClassesAndDivisionDto
   * @returns
   */
  @Patch(':classUniqueId')
  @ApiOperation({ summary: 'Update class by class unique id' })
  @HttpCode(HTTP_SUCCESS_GET)
  @ApiResponse(CLASS_LISTING)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @Permissions({
    roles: [Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async update(
    @Param('classUniqueId') classUniqueId: string,
    @Body() updateClassesAndDivisionDto: UpdateClassesAndDivisionDto,
  ) {
    await this.classesAndDivisionsService.update(
      classUniqueId,
      updateClassesAndDivisionDto,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Class successfully updated',
    };
  }

  /**
   * Delete class
   * @param classUniqueId
   * @returns
   */
  @Permissions({
    roles: [Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  @ApiOperation({ summary: 'Delete class by classUniqueId' })
  @HttpCode(HTTP_SUCCESS_GET)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @Delete(':classUniqueId')
  async remove(@Param('classUniqueId') classUniqueId: string) {
    await this.classesAndDivisionsService.remove(classUniqueId);

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Class successfully deleted',
    };
  }
}
