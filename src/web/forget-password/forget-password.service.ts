import { SuperAdmin } from 'src/api/super-admin/entities/super-admin.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { encodePassword } from 'src/common/helper/bcrypt.helper';
import { Repository } from 'typeorm';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class ForgetPasswordService {
  constructor(
    @InjectRepository(SuperAdmin)
    private readonly superAdminRepository: Repository<SuperAdmin>,
  ) {}

  /**
   * get super admin using token
   * @param token
   */
  async getSuperAdmin(token: string) {
    const superAdmin = await this.superAdminRepository.findOne({
      where: {
        forgotPasswordCode: token,
      },
    });
    if (
      !superAdmin ||
      Date.now() > superAdmin.forgotPasswordCodeExpiredAt.getTime()
    ) {
      return;
    }
    return superAdmin;
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    superAdmin: SuperAdmin,
  ) {
    if (resetPasswordDto.password.length < 6) {
      throw new BadRequestException(
        'Password must be longer than or equal to 8 characters',
      );
    }
    if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException(
        'Password and confirm password does not match.',
      );
    }
    const password = encodePassword(resetPasswordDto.password);
    return await this.superAdminRepository.update(
      { id: superAdmin.id },
      { password, forgotPasswordCode: null, forgotPasswordCodeExpiredAt: null },
    );
  }
}
