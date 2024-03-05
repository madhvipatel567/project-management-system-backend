import { AssignWorkspaceDto } from './dto/assign-workspace.dto';
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  Get,
  UsePipes,
  ValidationPipe,
  Param,
  Put,
  UseInterceptors,
  UploadedFile,
  Delete,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiOperation,
  ApiBearerAuth,
  ApiTags,
  ApiResponse,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { HTTP_SUCCESS_GET, HTTP_SUCCESS_POST } from 'src/common/constants';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { AdminService } from './admin.service';
import { Admin } from './entities/admin.entity';
import { AdminResource } from './resources/admin.resource';
import { SocialLoginDto } from './dto/social-login.dto';
import {
  ADMIN_LOGIN_RESPONSE,
  ADMIN_RESPONSE,
  BAD_REQUEST_RESPONSE,
  CONFLICT_RESPONSE,
  GET_ADMIN,
  GET_RESPONSE_SUCCESS,
  POST_REQUEST_SUCCESS,
  UNAUTHORIZE_RESPONSE,
} from 'src/common/swagger.response';
import { Multer } from 'multer';
import { SuperAdmin } from '../super-admin/entities/super-admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { EditAdminDto } from './dto/edit-admin.dto';
import {
  Permissions,
  Roles,
} from 'src/common/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { SendgridService } from 'src/common/services/sendgrid.service';

@ApiTags('Admin')
@Controller('api/v1/admin')
export class AdminController {
  constructor(
    private readonly adminsService: AdminService,

    private sendgridService: SendgridService,
  ) {}

  /**
   * TODO: Uncomment if the system needs a login feature with an email and password.
   * Admin login with Email and Password
   * @param loginAdminDto
   * @returns
   */
  // @Post('login')
  // @ApiOperation({ summary: 'Login admin' })
  // @ApiResponse(ADMIN_LOGIN_RESPONSE)
  // @ApiResponse(BAD_REQUEST_RESPONSE)
  // @HttpCode(HTTP_SUCCESS_POST)
  // @UsePipes(ValidationPipe)
  // async loginAdmin(@Body() loginAdminDto: LoginAdminDto) {
  //   const Admin = await this.adminsService.login(loginAdminDto);
  //   return {
  //     statusCode: HTTP_SUCCESS_POST,
  //     message: 'You are successfully logged in',
  //     data: plainToInstance(AdminResource, Admin, {
  //       enableImplicitConversion: true,
  //       excludeExtraneousValues: true,
  //     }),
  //   };
  // }

  /**
   * Admin social login via Google/Microsoft
   * @param socialLoginDto
   * @param authSuperAdmin
   * @returns
   */
  @Post('social-login')
  @ApiOperation({
    summary: 'Social login',
    description: `    providerType = google, microsoft
      pass idToken for google login => idToken
      pass accessToken for microsoft login => accessToken`,
  })
  @HttpCode(HTTP_SUCCESS_POST)
  @ApiResponse(ADMIN_LOGIN_RESPONSE)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  async socialLogin(@Body() socialLoginDto: SocialLoginDto) {
    const adminData = await this.adminsService.socialLogin(socialLoginDto);

    // console.log(adminData);
    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'You are successfully logged in',
      data: plainToInstance(AdminResource, adminData, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
    };
  }

  @Post('send')
  @ApiQuery({
    name: 'email',
  })
  async sendEmail(@Query('email') email) {
    const mail = {
      to: email,
      subject: 'Greeting Message from NestJS Sendgrid',
      from: '<nkarkare@taskmgr.in>',
      text: 'Hello World from NestJS Sendgrid',
      // html: '<h1>Hello World from NestJS Sendgrid</h1>',
      templateId: 'd-9ec191f26dc046789a1462d81f7060fc',
      dynamic_template_data: {
        email: email,
        task: {
          title: 'task',
          description: 'test',
        },
      },
    };

    return await this.sendgridService.send(mail);
  }

  /**
   * Admin logout
   * @param authAdmin
   * @returns
   */
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout admin' })
  @ApiResponse(POST_REQUEST_SUCCESS)
  @ApiResponse(UNAUTHORIZE_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions({
    roles: [Roles.ADMIN],
  })
  async logout(@AuthUser() authAdmin: Admin) {
    await this.adminsService.logout(authAdmin);

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'You are successfully logged out',
    };
  }

  /**
   * admin list
   * @param authSuperAdmin
   * @returns
   */
  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Admin list',
  })
  @ApiResponse(ADMIN_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions({
    roles: [Roles.SUPERADMIN],
  })
  async adminList(
    @AuthUser() authSuperAdmin: SuperAdmin,
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
    @Query('search') search?: string,
  ) {
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 8;
    const admins = await this.adminsService.adminList(
      authSuperAdmin,
      {
        page,
        limit,
      },
      search,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: plainToInstance(AdminResource, admins.items, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
      meta: admins.meta,
    };
  }

  /**
   * create new admin
   * @param createAdminDto
   * @param authSuperAdmin
   * @param workspaceId
   * @param workspaceUniqueId
   * @returns
   */
  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create admin',
  })
  @ApiResponse(POST_REQUEST_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @UsePipes(ValidationPipe)
  @Permissions({
    roles: [Roles.SUPERADMIN],
  })
  @ApiQuery({ name: 'workspaceUniqueId', required: false })
  async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
    @AuthUser() authSuperAdmin: SuperAdmin,
    @Query('workspaceUniqueId') workspaceUniqueId: string,
  ) {
    await this.adminsService.createAdmin(
      createAdminDto,
      authSuperAdmin,
      workspaceUniqueId,
    );
    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'Administrator added successfully.',
    };
  }

  /**
   * Get admin details by admin unique ID
   * @param adminUniqueId
   * @returns
   */
  @Get('/:adminUniqueId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get admin details by adminUniqueId',
  })
  @ApiResponse(GET_ADMIN)
  @ApiResponse(CONFLICT_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions({
    roles: [Roles.SUPERADMIN],
  })
  async getAdmin(@Param('adminUniqueId') adminUniqueId: string) {
    const admin = await this.adminsService.getAdmin(adminUniqueId);

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: plainToInstance(AdminResource, admin, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Edit admin details by admin Unique Id
   * @param editAdminDto
   * @param authSuperAdmin
   * @param profilePic
   * @param adminUniqueId
   * @returns
   */
  @Put('/:adminUniqueId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update admin details by adminUniqueId',
  })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(CONFLICT_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profilePic'))
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions({
    roles: [Roles.SUPERADMIN],
  })
  @UsePipes(ValidationPipe)
  async editAdmin(
    @Body() editAdminDto: EditAdminDto,
    @AuthUser() authSuperAdmin: SuperAdmin,
    @Param('adminUniqueId') adminUniqueId: string,
    @UploadedFile() profilePic: Multer.File,
  ) {
    await this.adminsService.editAdmin(
      editAdminDto,
      authSuperAdmin,
      adminUniqueId,
      profilePic,
    );
    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Admin successfully updated',
    };
  }

  /**
   * Delete admin by admin unique ID
   * @param adminUniqueId
   * @returns
   */
  @Delete('/:adminUniqueId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete admin by adminUniqueId',
  })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(CONFLICT_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions({
    roles: [Roles.SUPERADMIN],
  })
  @UsePipes(ValidationPipe)
  async deleteAdmin(@Param('adminUniqueId') adminUniqueId: string) {
    await this.adminsService.deleteAdmin(adminUniqueId);
    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Admin successfully deleted',
    };
  }

  /**
   * Assign workspace to admin
   * @param assignWorkspaceDto
   * @returns
   */
  @Post('/assign-workspace')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Assign workspace to admin',
  })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(CONFLICT_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async assignWorkspace(@Body() assignWorkspaceDto: AssignWorkspaceDto) {
    await this.adminsService.assignWorkspace(assignWorkspaceDto);
    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Admin successfully assigned to workspace',
    };
  }

  /**
   * Remove workspace by workspace ID & admin Id
   * @param workspaceUniqueId
   * @param adminUniqueId
   * @returns
   */
  @Delete('/remove/workspace')
  @ApiOperation({ summary: 'Remove workspace from admin' })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(CONFLICT_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @ApiQuery({ name: 'workspaceUniqueId', required: true })
  @ApiQuery({ name: 'adminUniqueId', required: true })
  @UsePipes(ValidationPipe)
  async removeWorkspaceFromAdmin(
    @Query('workspaceUniqueId') workspaceUniqueId: string,
    @Query('adminUniqueId') adminUniqueId: string,
  ) {
    await this.adminsService.removeWorkspaceFromAdmin(
      workspaceUniqueId,
      adminUniqueId,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Workspace successfully removed',
    };
  }
}
