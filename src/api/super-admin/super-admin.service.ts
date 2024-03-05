import { Repository } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { AccessTokensService } from 'src/access-tokens/access-tokens.service';
import {
  comparePassword,
  encodePassword,
} from 'src/common/helper/bcrypt.helper';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { RefreshTokensService } from 'src/refresh-tokens/refresh-tokens.service';
import { SuperAdmin } from './entities/super-admin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginSuperAdminDto } from './dto/login-super-admin.dto copy';
import { ChangePasswordSuperAdminDto } from './dto/change-password-super-admin.dto';
import { ForgotPasswordSuperAdminDto } from './dto/forgot-password-super-admin.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { RegisterSuperAdminDto } from './dto/register-super-admin.dto';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(SuperAdmin)
    private readonly superAdminRepository: Repository<SuperAdmin>,

    private accessTokensService: AccessTokensService,
    private refreshTokensService: RefreshTokensService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  /**
   * register super admin
   * @param registerSuperAdminDto
   * @returns
   */
  async register(registerSuperAdminDto: RegisterSuperAdminDto) {
    const superAdminExists: SuperAdmin = await this.findByEmail(
      registerSuperAdminDto.email,
    );

    if (superAdminExists) {
      throw new BadRequestException(
        'This email is already registered with us.',
      );
    }

    const superAdmin = await this.createOrUpdate({
      ...registerSuperAdminDto,
      uniqueid: randomBytes(16).toString('hex'),
      password: encodePassword(registerSuperAdminDto.password),
    });

    Object.assign(superAdmin, { loggedInRole: 'superadmin' });

    const tokens = await this.accessTokensService.generateTokens(superAdmin);

    return {
      ...superAdmin,
      authentication: { ...tokens },
    };
  }

  /**
   * find super admin using email
   * @param email
   * @returns
   */
  async findByEmail(email: string): Promise<SuperAdmin> {
    return await this.superAdminRepository.findOne({ where: { email } });
  }

  /**
   * store or update super admin
   * @param data
   * @param id
   * @returns
   */
  async createOrUpdate(data: any, id: number = null) {
    if (id) {
      await this.superAdminRepository.update(id, data);
    } else {
      const superAdmin: SuperAdmin = await this.superAdminRepository.save(data);
      id = superAdmin.id;
    }
    return await this.findById(id);
  }

  /**
   * find super admin using id
   * @param id
   * @returns
   */
  async findById(id: number) {
    return await this.superAdminRepository.findOne({ where: { id: id } });
  }

  /**
   * login superAdmin
   * @param loginSuperAdminDto
   * @returns
   */
  async login(loginSuperAdminDto: LoginSuperAdminDto) {
    const superAdmin: SuperAdmin = await this.findByEmail(
      loginSuperAdminDto.email,
    );

    if (!superAdmin) {
      throw new BadRequestException(
        'You are not registered with us! Please register first.',
      );
    }

    if (superAdmin.deletedAt) {
      throw new BadRequestException(
        'Your account has been temporarily disabled. Contact the administrator for more support.',
      );
    }
    if (!comparePassword(loginSuperAdminDto.password, superAdmin.password)) {
      throw new BadRequestException(
        'Invalid password! Please check your password and try again.',
      );
    }
    const tokens = await this.accessTokensService.generateTokens(superAdmin);

    Object.assign(superAdmin, { loggedInRole: 'superadmin' });
    return {
      ...superAdmin,
      authentication: { ...tokens },
    };
  }

  /**
   * logout super admin
   * @param superAdmin
   */
  async logout(superAdmin: SuperAdmin) {
    // const tokens = await this.deviceTokenRepository.find({
    //   where: { superAdmin: { id: superAdmin.id } },
    // });

    // if (tokens) {
    //   await Promise.all(
    //     tokens.map(async (token) => {
    //       await this.deviceTokenRepository.delete({ id: token.id });
    //     }),
    //   );
    // }
    await Promise.all([
      this.accessTokensService.revokeToken(superAdmin.jti),
      this.refreshTokensService.revokeTokenUsingJti(superAdmin.jti),
    ]);
  }

  /**
   * change super admin password
   * @param changePasswordSuperAdminDto
   * @param authSuperAdmin
   * @returns
   */
  async changePasswordSuperAdmin(
    changePasswordSuperAdminDto: ChangePasswordSuperAdminDto,
    authSuperAdmin: SuperAdmin,
  ) {
    if (
      !comparePassword(
        changePasswordSuperAdminDto.oldPassword,
        authSuperAdmin.password,
      )
    ) {
      throw new BadRequestException('Please enter a valid old password');
    }
    return await this.createOrUpdate(
      { password: encodePassword(changePasswordSuperAdminDto.password) },
      authSuperAdmin.id,
    );
  }

  /**
   * forgot password super admin
   * @param forgotPasswordSuperAdminDto
   * @returns
   */
  async forgotPasswordSuperAdmin(
    forgotPasswordSuperAdminDto: ForgotPasswordSuperAdminDto,
  ) {
    const superadmin = await this.findByEmail(
      forgotPasswordSuperAdminDto.email,
    );
    if (!superadmin) {
      throw new BadRequestException('This email is not register with us');
    }

    const forgotPasswordCode = uuidv4();
    const forgotPasswordCodeExpiredAt = moment()
      .add(10, 'minutes')
      .format('YYYY-MM-DD HH:mm:ss');

    // Send mail
    const url = `${this.configService.get<string>(
      'APP_URL',
    )}/forget-password/${forgotPasswordCode}`;

    await this.mailerService.sendMail({
      to: superadmin.email,
      subject: `${this.configService.get('APP_NAME')} app! Forgot password`,
      template: 'forgot-password',
      context: {
        superadmin: superadmin,
        url,
      },
    });

    await this.createOrUpdate(
      { forgotPasswordCode, forgotPasswordCodeExpiredAt },
      superadmin.id,
    );
  }
}
