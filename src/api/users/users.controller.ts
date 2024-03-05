import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  Put,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HTTP_SUCCESS_POST,
  Operations,
  PermissionModules,
} from 'src/common/constants';
import { Multer } from 'multer';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import {
  Permissions,
  Roles,
} from 'src/common/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import {
  BAD_REQUEST_RESPONSE,
  CONFLICT_RESPONSE,
  GET_RESPONSE_SUCCESS,
  POST_REQUEST_SUCCESS,
  USER_LOGIN_RESPONSE,
} from 'src/common/swagger.response';
import { SocialLoginDto } from '../admin/dto/social-login.dto';
import { CreateUserDto, ImportUserDto } from './dto/create-user.dto';
import { HTTP_SUCCESS_GET } from './../../common/constants';
import { UserResource } from './resources/user.resource';
import { Users } from 'src/api/users/entities/user.entity';
import { plainToInstance } from 'class-transformer';
import {
  UNAUTHORIZE_RESPONSE,
  USERS_LISTING,
} from './../../common/swagger.response';

import { Get, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('User')
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * TODO: Uncomment if the system needs a login feature with an email and password.
   * User login with Email and Password
   * @param loginUserDto
   * @returns
   */
  // @Post('login')
  // @ApiOperation({ summary: 'Login user' })
  // @ApiResponse(USER_LOGIN_RESPONSE)
  // @ApiResponse(BAD_REQUEST_RESPONSE)
  // @HttpCode(HTTP_SUCCESS_POST)
  // @UsePipes(ValidationPipe)
  // async loginUser(@Body() loginUserDto: LoginUserDto) {
  //   const user = await this.usersService.login(loginUserDto);
  //   return {
  //     statusCode: HTTP_SUCCESS_POST,
  //     message: 'You are successfully logged in',
  //     data: plainToInstance(UserResource, user, {
  //       enableImplicitConversion: true,
  //       excludeExtraneousValues: true,
  //     }),
  //   };
  // }

  /**
   * User social login via Google/Microsoft
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
  @ApiResponse(USER_LOGIN_RESPONSE)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  async socialLogin(@Body() socialLoginDto: SocialLoginDto) {
    const userData = await this.usersService.socialLogin(socialLoginDto);

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'You are successfully logged in',
      data: plainToInstance(UserResource, userData, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * TODO: Email verification
   * create user manually
   * @param createUserDto
   * @returns
   */
  @Post('/')
  @ApiOperation({ summary: 'Create user manually' })
  @ApiResponse(POST_REQUEST_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions({
    roles: [Roles.ADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.CREATE],
    module: PermissionModules.USER_MODULE,
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    await this.usersService.createUser(createUserDto);

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'User successfully created',
    };
  }

  /**
   * TODO: Email verification if email is changed
   * create user manually
   * @param createUserDto
   * @returns
   */
  @Put('/:userUniqueId')
  @ApiOperation({ summary: 'Edit user' })
  @ApiResponse(POST_REQUEST_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions({
    roles: [Roles.ADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.CREATE],
    module: PermissionModules.USER_MODULE,
  })
  async editUser(
    @Body() updateUserDto: UpdateUserDto,
    @Param('userUniqueId') userUniqueId: string,
  ) {
    await this.usersService.updateUser(updateUserDto, userUniqueId);

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'User successfully updated',
    };
  }

  /**
   * User logout
   * @param authUser
   * @returns
   */
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse(POST_REQUEST_SUCCESS)
  @ApiResponse(UNAUTHORIZE_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @UseGuards(AuthGuard('jwt'))
  async logout(@AuthUser() authUser: Users) {
    await this.usersService.logout(authUser);

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'You are successfully logged out',
    };
  }

  /**
   * TODO: Email verification for imported users
   * Import users within workspaces
   * @param importUserDto
   * @param csvFile
   * @returns
   */
  @Post('/import')
  @ApiOperation({ summary: 'Create user by importing csv' })
  @ApiResponse(POST_REQUEST_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @UseInterceptors(FileInterceptor('csvFile'))
  @ApiConsumes('multipart/form-data')
  @Permissions({
    roles: [Roles.ADMIN, Roles.ROLE_BASED_USER],
    operations: [Operations.CREATE],
    module: PermissionModules.USER_MODULE,
  })
  async importAndCreateUsers(
    @Body() importUserDto: ImportUserDto,
    @UploadedFile() csvFile: Multer.File,
  ) {
    const data = await this.usersService.importAndCreateUsers(
      csvFile,
      importUserDto,
    );

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'User successfully created',
      data,
    };
  }

  /**
   * Listout users
   * @param auth
   * @param workspaceUniqueId
   * @param _page
   * @param _limit
   * @param search
   * @returns
   */
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Users list by workspace' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse(USERS_LISTING)
  @HttpCode(HTTP_SUCCESS_GET)
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async userList(
    @AuthUser() auth: any,
    @Query('workspaceUniqueId') workspaceUniqueId: string,
    @Query('page') _page?: string,
    @Query('limit') _limit?: string,
    @Query('search') search?: string,
  ) {
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 15;
    const users = await this.usersService.userList(
      auth,
      {
        page,
        limit,
      },
      workspaceUniqueId,
      search,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      data: plainToInstance(UserResource, users.items, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
      meta: users.meta,
    };
  }

  /**
   * Delete user by userUniqueId
   * @param id
   * @returns
   */
  @Delete('/:userUniqueId')
  @ApiOperation({ summary: 'Delete users' })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(CONFLICT_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @UsePipes(ValidationPipe)
  @Permissions({
    roles: [Roles.ADMIN],
  })
  async deleteWorkspace(@Param('userUniqueId') userUniqueId: string) {
    await this.usersService.deleteUser(userUniqueId);

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'User successfully deleted',
    };
  }

  /**
   * export users
   * @param res
   * @param workspaceUniqueId
   * @returns
   */
  @Get('export/:workspaceUniqueId')
  @ApiOperation({ summary: 'Export users details' })
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async exportUsers(
    @Res({ passthrough: true }) res: Response,
    @Param('workspaceUniqueId') workspaceUniqueId: string,
  ): Promise<StreamableFile> {
    const exportUserDetails = await this.usersService.exportUserDetails(
      workspaceUniqueId,
    );

    res.set({
      'Content-Type': exportUserDetails.fileType,
      'Content-Disposition': `attachment; filename=${exportUserDetails.fileName}`,
    });

    return new StreamableFile(exportUserDetails.file);
  }
}
