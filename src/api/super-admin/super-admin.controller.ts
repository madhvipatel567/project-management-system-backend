import { HTTP_SUCCESS_POST } from './../../common/constants';
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
  HttpCode,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SuperAdminResource } from './resources/super-admin.resource';
import { LoginSuperAdminDto } from './dto/login-super-admin.dto copy';
import { SuperAdmin } from './entities/super-admin.entity';
import { ChangePasswordSuperAdminDto } from './dto/change-password-super-admin.dto';
import { ForgotPasswordSuperAdminDto } from './dto/forgot-password-super-admin.dto';
import { SuperAdminService } from './super-admin.service';
import { RegisterSuperAdminDto } from './dto/register-super-admin.dto';
import {
  BAD_REQUEST_RESPONSE,
  POST_REQUEST_SUCCESS,
  SUPERADMIN_USER_RESPONSE,
  UNAUTHORIZE_RESPONSE,
} from 'src/common/swagger.response';

@ApiTags('Super Admin')
@Controller('api/v1/super-admin')
export class SuperAdminsController {
  constructor(private readonly superAdminsService: SuperAdminService) {}

  /**
   * Register super admin
   * @param registerSuperAdminDto
   * @returns
   */
  @Post('register')
  @ApiOperation({
    summary:
      '****This is only for testing purposes; we will register superadmin from the web after making payment.****',
  })
  @ApiResponse(SUPERADMIN_USER_RESPONSE)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @UsePipes(ValidationPipe)
  async registerSuperAdmin(
    @Body() registerSuperAdminDto: RegisterSuperAdminDto,
  ) {
    const superAdmin = await this.superAdminsService.register(
      registerSuperAdminDto,
    );

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'You are successfully registered.',
      data: plainToInstance(SuperAdminResource, superAdmin, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Super admin login
   * @param loginSuperAdminDto
   * @returns
   */
  @Post('login')
  @ApiOperation({ summary: 'Login super admin' })
  @ApiResponse(SUPERADMIN_USER_RESPONSE)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @UsePipes(ValidationPipe)
  async loginSuperAdmin(@Body() loginSuperAdminDto: LoginSuperAdminDto) {
    const superAdmin = await this.superAdminsService.login(loginSuperAdminDto);

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'You are successfully logged in.',
      data: plainToInstance(SuperAdminResource, superAdmin, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Super admin logout
   * @param authSuperAdmin
   * @returns
   */
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout super admin',
  })
  @ApiResponse(POST_REQUEST_SUCCESS)
  @ApiResponse(UNAUTHORIZE_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @UseGuards(AuthGuard('jwt'))
  async logout(@AuthUser() authSuperAdmin: SuperAdmin) {
    await this.superAdminsService.logout(authSuperAdmin);

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'You are successfully logged out.',
    };
  }

  /**
   * Super admin change password
   * @param changePasswordSuperAdminDto
   * @param authSuperAdmin
   * @returns
   */
  @Put('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Super admin change password' })
  @ApiResponse(POST_REQUEST_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async changePasswordSuperAdmin(
    @Body() changePasswordSuperAdminDto: ChangePasswordSuperAdminDto,
    @AuthUser() authSuperAdmin: SuperAdmin,
  ) {
    await this.superAdminsService.changePasswordSuperAdmin(
      changePasswordSuperAdminDto,
      authSuperAdmin,
    );

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'Your password has been successfully changed.',
    };
  }

  /**
   * Super admin forgot password
   * @param forgotPasswordSuperAdminDto
   * @returns
   */
  @Post('forgot-password')
  @ApiOperation({ summary: 'Super admin forgot Password' })
  @ApiResponse(POST_REQUEST_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @UsePipes(ValidationPipe)
  async forgotPasswordSuperAdmin(
    @Body() forgotPasswordSuperAdminDto: ForgotPasswordSuperAdminDto,
  ) {
    await this.superAdminsService.forgotPasswordSuperAdmin(
      forgotPasswordSuperAdminDto,
    );
    return {
      statusCode: HTTP_SUCCESS_POST,
      message:
        'A forget password link is sent to your registered email address.',
    };
  }
}
