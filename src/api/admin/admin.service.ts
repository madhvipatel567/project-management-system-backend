import { AssignWorkspaceDto } from './dto/assign-workspace.dto';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { Workspace } from 'src/api/workspaces/entities/workspace.entity';
import { WorkspaceAdminMappingService } from './../workspace-admin-mappings/workspace-admin-mapping.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccessTokensService } from 'src/access-tokens/access-tokens.service';
import { RefreshTokensService } from 'src/refresh-tokens/refresh-tokens.service';
import { Brackets, FindOperator, In, Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { SocialLoginDto } from './dto/social-login.dto';
import { PROVIDER_TYPES } from 'src/common/constants';
import SocialiteGoogle from 'src/common/socialite/socialite-google';
import SocialiteMicrosoft from 'src/common/socialite/socialite-microsoft';
import { Multer } from 'multer';
import {
  deleteFile,
  imageFileFilter,
  uploadFile,
} from 'src/common/helper/fileupload.helper';
import { EditAdminDto } from './dto/edit-admin.dto';
import { SuperAdmin } from '../super-admin/entities/super-admin.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { CreateAdminDto } from './dto/create-admin.dto';
import { generateUniqueId } from 'src/common/helper/common.helper';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    private workspaceAdminMappingService: WorkspaceAdminMappingService,
    private accessTokensService: AccessTokensService,
    private refreshTokensService: RefreshTokensService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  /**
   * TODO: Uncomment if the system needs a login feature with an email and password.
   * login admin with email and password
   * @param loginAdminDto
   * @returns
   */
  // async login(loginAdminDto: LoginAdminDto) {
  //   const admin: Admin = await this.findByEmail(loginAdminDto.email);

  //   if (!admin) {
  //     throw new BadRequestException(
  //       'This email address is not registered with us! Please contact superadmin for credentials',
  //     );
  //   }

  //   if (admin.deletedAt) {
  //     throw new BadRequestException(
  //       'Your account has been temporarily disabled. Contact the administrator for more support.',
  //     );
  //   }
  //   if (!comparePassword(loginAdminDto.password, admin.password)) {
  //     throw new BadRequestException('Please check your password and try again');
  //   }
  // const tokens = await this.accessTokensService.generateTokens(admin);

  //   return {
  //     ...admin,
  //     authentication: { ...tokens },
  //   };
  // }

  /**
   * social login Google/MS
   * @param socialLoginDto
   * @returns
   */
  async socialLogin(socialLoginDto: SocialLoginDto) {
    let socialUser: any;
    if (socialLoginDto.providerType === PROVIDER_TYPES.GOOGLE) {
      socialUser = await new SocialiteGoogle().generateUserFromToken(
        socialLoginDto.token,
      );
    }

    if (socialLoginDto.providerType === PROVIDER_TYPES.MICROSOFT) {
      socialUser = await new SocialiteMicrosoft().generateUserFromToken(
        socialLoginDto.token,
      );
    }

    if (!socialUser) throw new BadRequestException('Invalid provider');

    const admin = await this.adminRepository.findOne({
      where: { email: socialUser.email },
    });

    if (!admin) {
      throw new BadRequestException(
        'Admin with provided account not exists! Please contact super administrator.',
      );
    }

    await this.adminRepository.update(admin.id, {
      name: socialUser.name,
      profilePic: socialUser.profilePic,
      providerId: socialUser.providerId,
    });

    const newAdmin = await this.findById(admin.id);

    const tokens = await this.accessTokensService.generateTokens(newAdmin);

    Object.assign(newAdmin, { loggedInRole: 'admin' });

    // await this.adminActivityService.create(
    //   `Logged in at <b>${moment().format('ddd DD MMM, YYYY hh:mm A')}</b>`,
    // );

    return {
      ...newAdmin,
      authentication: { ...tokens },
    };
    // return this.createOrUpdate(socialUser, user.id);
  }

  /**
   * logout admin
   * TODO: device tokens deletion after push notification implementation
   * @param admin
   */
  async logout(admin: Admin) {
    // const tokens = await this.deviceTokenRepository.find({
    //   where: { admin: { id: admin.id } },
    // });

    // if (tokens) {
    //   await Promise.all(
    //     tokens.map(async (token) => {
    //       await this.deviceTokenRepository.delete({ id: token.id });
    //     }),
    //   );
    // }

    await Promise.all([
      this.accessTokensService.revokeToken(admin.jti),
      this.refreshTokensService.revokeTokenUsingJti(admin.jti),
    ]);
  }

  /**
   * find admins with in IDs
   * @param arrayId
   * @returns
   */
  async findIdIn(arrayIds: readonly number[]) {
    return this.adminRepository.find({
      where: { id: In(arrayIds) },
    });
  }

  /**
   * find admin using email
   * @param email
   * @returns
   */
  async findByEmail(email: string): Promise<Admin> {
    return await this.adminRepository.findOne({
      where: { email: email },
    });
  }

  /**
   * store or update admin
   * @param data
   * @param id
   * @returns
   */
  async createOrUpdate(data: any, id: number = null) {
    if (id) {
      await this.adminRepository.update(id, data);
    } else {
      const adminUniqueId = await generateUniqueId('A');

      const admin: Admin = await this.adminRepository.save({
        ...data,
        adminUniqueId,
      });
      id = admin.id;
    }
    return await this.findById(id);
  }

  /**
   * find admin using id
   * @param id
   * @returns
   */
  async findById(id: number) {
    return await this.adminRepository.findOne({ where: { id: id } });
  }

  /**
   * find admin using adminUniqueId
   * @param adminUniqueId
   * @returns
   */
  async findByUniqueId(adminUniqueId: string) {
    return await this.adminRepository.findOne({
      where: { adminUniqueId: adminUniqueId },
    });
  }

  /**
   * find user by provider Id and token
   * @param providerType
   * @param providerId
   */
  async findByProviderTypeAndId(providerType: string, providerId: string) {
    return await this.adminRepository.findOne({
      where: {
        providerType,
        providerId,
      },
    });
  }

  /**
   * admin list
   * @param authSuperAdmin
   * @returns
   */
  async adminList(
    authSuperAdmin: SuperAdmin,
    options: IPaginationOptions,
    search: string,
  ) {
    // const admins = await this.adminRepository.find({
    //   where: { superAdmin: { id: authSuperAdmin.id } },
    // });

    const queryBuilder = this.adminRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.superAdmin', 'sa')
      .where('sa.id =:superAdminId', {
        superAdminId: authSuperAdmin.id,
      });

    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('a.email LIKE :search', { search: `%${search}%` }).orWhere(
            'a.name LIKE :search',
            { search: `%${search}%` },
          );
        }),
      );
    }

    queryBuilder.orderBy('a.createdAt', 'DESC');

    return await paginate<Admin>(queryBuilder, options);
  }

  /**
   * admin by unique ID
   * @param id
   * @returns
   */
  async getAdmin(adminUniqueId: string) {
    const admin = await this.adminRepository.findOne({
      where: { adminUniqueId },
    });

    if (!admin) {
      throw new ConflictException('Admin not exists!');
    }

    return admin;
  }

  /**
   * create admins
   * TODO: Send welcome mail
   * @param createAdminDto
   * @param authSuperAdmin
   * @param workspaceId
   * @returns
   */
  async createAdmin(
    createAdminDto: CreateAdminDto,
    authSuperAdmin: SuperAdmin,
    workspaceUniqueId: string,
  ) {
    const admin = await this.adminRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.superAdmin', 's')
      .where('a.email =:email', { email: createAdminDto.email })
      .getOne();

    if (admin) {
      if (admin.superAdmin.id != authSuperAdmin.id) {
        throw new BadRequestException(
          'There is already an administrator with this email address and it is associated with another organization.',
        );
      }
      throw new BadRequestException(
        'There is already an administrator with this email address.',
      );
    }

    const savedAdmin = await this.createOrUpdate({
      ...createAdminDto,
      superAdmin: authSuperAdmin,
    });

    if (workspaceUniqueId !== '') {
      const workspace = await this.workspaceRepository.findOne({
        where: { workspaceUniqueId: workspaceUniqueId },
      });

      if (!workspace) {
        throw new BadRequestException('Workspace not found!');
      }

      await this.workspaceAdminMappingService.create(savedAdmin, workspace);
    }

    // // Send invitation mail
    // const url = `${this.configService.get<string>('FRONTEND_URL')}/admin/login`;

    // this.mailerService.sendMail({
    //   to: createAdminDto.email,
    //   subject: `${this.configService.get('APP_NAME')} app! Admin invitation`,
    //   template: 'admin-invitation',
    //   context: {
    //     email: createAdminDto.email,
    //     url: url,
    //   },
    // });
  }

  /**
   * edit admins
   * @param editAdminDto
   * @param authSuperAdmin
   * @param profilePic
   * @returns
   */
  async editAdmin(
    editAdminDto: EditAdminDto,
    authSuperAdmin: SuperAdmin,
    adminUniqueId: string,
    profilePic: Multer.File,
  ) {
    const adminExists = await this.adminRepository
      .createQueryBuilder('a')
      .where('name = :name', { name: editAdminDto.name.trim() })
      .andWhere('adminUniqueId != :adminUniqueId', { adminUniqueId })
      .getOne();

    if (adminExists)
      throw new BadRequestException('Admin with this name already exists');

    const admin = await this.adminRepository.findOne({
      where: { adminUniqueId },
    });

    if (!admin) {
      throw new ConflictException('Admin not exists!');
    }

    let avatar = admin.profilePic;
    if (profilePic) {
      if (avatar) deleteFile(avatar);

      if (!imageFileFilter(profilePic)) {
        throw new BadRequestException(
          'Only image files are allowed! Ex. jpg, jpeg, png',
        );
      }
      avatar = uploadFile('admins', profilePic);
    }

    await this.adminRepository.save({
      id: admin.id,
      ...editAdminDto,
      profilePic: avatar,
      superAdmin: authSuperAdmin,
    });
  }

  /**
   * delete admins
   * @param id
   * @returns
   */
  async deleteAdmin(adminUniqueId: string) {
    const admin = await this.adminRepository.findOne({
      where: { adminUniqueId },
    });

    if (!admin) throw new ConflictException('Admin not found');

    await this.adminRepository.remove(admin);
  }

  /**
   * Assign workspace to admin
   * @param assignWorkspaceDto
   * @returns
   */
  async assignWorkspace(assignWorkspaceDto: AssignWorkspaceDto) {
    const admin = await this.adminRepository.findOne({
      where: {
        adminUniqueId: assignWorkspaceDto.adminUniqueId,
      },
    });

    const workspace = await this.workspaceRepository.findOne({
      where: {
        workspaceUniqueId: assignWorkspaceDto.workspaceUniqueId,
      },
    });

    if (!admin || !workspace) {
      throw new ConflictException('Admin or workspace not found');
    }

    await this.workspaceAdminMappingService.create(admin, workspace);
  }

  /**
   * Rmove workspace from admin
   * @param workspaceUniqueId
   * @param adminUniqueId
   * @returns
   */
  async removeWorkspaceFromAdmin(
    workspaceUniqueId: string,
    adminUniqueId: string,
  ) {
    const admin = await this.findByUniqueId(adminUniqueId);

    const workspace = await this.workspaceRepository
      .createQueryBuilder('w')
      .where('w.workspaceUniqueId =:workspaceUniqueId', {
        workspaceUniqueId: workspaceUniqueId,
      })
      .getOne();

    if (!admin || !workspace) {
      throw new ConflictException('Admin or workspace not found');
    }

    await this.workspaceAdminMappingService.remove(admin, workspace);
  }
}
