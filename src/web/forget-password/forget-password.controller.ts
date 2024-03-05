import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Render,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgetPasswordService } from './forget-password.service';

@ApiExcludeController()
@Controller('forget-password')
export class ForgetPasswordController {
  constructor(private readonly forgetPasswordService: ForgetPasswordService) {}

  /**
   * reset password page
   * @param token
   * @returns
   */
  @Get(':token')
  @Render('web/reset-password')
  async resetPassword(@Param('token') token: string) {
    const user = await this.forgetPasswordService.getSuperAdmin(token);
    return {
      user,
    };
  }

  /**
   * reset password page
   * @param token
   * @returns
   */
  @Post(':token')
  @UsePipes(ValidationPipe)
  async resetPasswordSave(
    @Param('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    const user = await this.forgetPasswordService.getSuperAdmin(token);
    if (!user) {
      throw new BadRequestException(
        'Link Expired. Please try to reset your password again.',
      );
    }

    await this.forgetPasswordService.resetPassword(resetPasswordDto, user);
    return {
      message: 'Password has been successfully changed.',
    };
  }
}
