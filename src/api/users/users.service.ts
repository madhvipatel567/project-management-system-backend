import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { RefreshTokensService } from 'src/refresh-tokens/refresh-tokens.service';
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Users } from './entities/user.entity';
import { EXPORT_FILENAME, PROVIDER_TYPES } from 'src/common/constants';
import { AccessTokensService } from 'src/access-tokens/access-tokens.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RolePermissionMappingService } from '../role-permission-mappings/role-permission-mapping..service';
import { generateUniqueId } from 'src/common/helper/common.helper';
import readXlsxFile from 'read-excel-file/node';
import {
  createXlsxFile,
  deleteFile,
  uploadFile,
  xlsxFileFilter,
} from 'src/common/helper/fileupload.helper';
import { join } from 'path';
import { classToPlain } from 'class-transformer';
import { RoleService } from '../roles/role.service';
import SocialiteGoogle from 'src/common/socialite/socialite-google';
import SocialiteMicrosoft from 'src/common/socialite/socialite-microsoft';
import { Role } from '../roles/entities/role.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import * as moment from 'moment';
import { TASK_STATUS } from '../tasks/entities/task.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,

    @Inject(forwardRef(() => RolePermissionMappingService))
    private rolePermissionMappingService: RolePermissionMappingService,
    private roleService: RoleService,
    private accessTokensService: AccessTokensService,
    private refreshTokensService: RefreshTokensService,
  ) {}

  /**
   * TODO: Uncomment if the system needs a login feature with an email and password.
   * login user with email and password
   * @param loginUserDto
   * @returns
   */
  // async login(loginUserDto: LoginUserDto) {
  //   const user: User = await this.findByEmail(loginUserDto.email);

  //   if (!user) {
  //     throw new BadRequestException(
  //       'This email address is not registered with us! Please contact admin for credentials',
  //     );
  //   }

  //   if (user.deletedAt) {
  //     throw new BadRequestException(
  //       'Your account has been temporarily disabled. Contact the administrator for more support.',
  //     );
  //   }
  //   if (!comparePassword(loginUserDto.password, user.password)) {
  //     throw new BadRequestException('Please check your password and try again');
  //   }
  // const tokens = await this.accessTokensService.generateTokens(user);

  //   return {
  //     ...user,
  //     authentication: { ...tokens },
  //   };
  // }

  /**
   * logout user
   * @param user
   */
  async logout(user: Users) {
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
      this.accessTokensService.revokeToken(user.jti),
      this.refreshTokensService.revokeTokenUsingJti(user.jti),
    ]);
  }

  /**
   * find user using id
   * @param userId
   * @returns
   */
  async findById(userId: number) {
    return await this.userRepository.findOne({ where: { id: userId } });
  }

  /**
   * Find user with role
   * @param userId
   * @param roleId
   * @returns
   */
  async findUserWithRole(userId: number) {
    return await this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'r')
      .where('u.id = :id', { id: userId })
      .getOne();
  }

  /**
   * find user using uniqueId
   * @param userUniqueId
   * @returns
   */
  async findByUniqueId(userUniqueId: string) {
    return await this.userRepository
      .createQueryBuilder('u')
      .where('userUniqueId =:userUniqueId', { userUniqueId })
      .getOne();
  }

  /**
   * find user using uniqueId
   * @param userUniqueId
   * @returns
   */
  async findByUniqueIdAndWorkspace(
    userUniqueId: string,
    workspaceUniqueId: string,
  ) {
    return await this.userRepository.findOne({
      where: {
        userUniqueId: userUniqueId,
        role: { workspace: { workspaceUniqueId: workspaceUniqueId } },
      },
    });
    // return await this.userRepository
    //   .createQueryBuilder('u')
    //   .leftJoinAndSelect('u.role', 'r')
    //   .leftJoinAndSelect('r.workspace', 'w')
    //   .where('u.userUniqueId =:userUniqueId', { userUniqueId: userUniqueId })
    //   .where('w.workspaceUniqueId =:workspaceUniqueId', { workspaceUniqueId })
    //   .getOne();
  }

  /**
   * find user using uniqueId
   * @param userUniqueId
   * @returns
   */
  async findOne(userId: string) {
    return await this.userRepository
      .createQueryBuilder('u')
      .where('id =:userId', { userId })
      .getOne();
  }

  /**
   * find user using email
   * @param email
   * @returns
   */
  async findByEmail(email: string, userUniqueId?: string) {
    const qb = this.userRepository
      .createQueryBuilder('u')
      .where('email =:email', { email })
      .withDeleted();

    if (userUniqueId)
      qb.andWhere('userUniqueId !=:userUniqueId', { userUniqueId });

    return await qb.getOne();
  }

  /**
   * store or update user
   * @param data
   * @param userId
   * @returns
   */
  async createOrUpdate(data: any, userId: number = null) {
    if (userId) {
      await this.userRepository.update(userId, data);
    } else {
      const user: Users = await this.userRepository.save(data);
      userId = user.id;
    }
    return await this.findById(userId);
  }

  /**
   * social login Google/MS
   * @param socialLoginDto
   * @returns
   */
  async socialLogin(socialLoginDto) {
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

    const user = await this.userRepository.findOne({
      where: { email: socialUser.email },
    });

    if (!user) {
      throw new BadRequestException(
        'User with provided account not exists! Please contact your administrator.',
      );
    }

    await this.userRepository.update(user.id, {
      name: socialUser.name,
      profilePic: socialUser.profilePic,
      providerId: socialUser.providerId,
    });

    const newUser = await this.findUserWithRole(user.id);
    const role = newUser.role.roleName;

    const tokens = await this.accessTokensService.generateTokens(newUser, role);

    Object.assign(newUser, { loggedInRole: 'user' });

    await this.userRepository.update(newUser.id, {
      lastLoggedInAt: moment().toDate(),
    });

    return {
      ...newUser,
      authentication: { ...tokens },
    };
    // return this.createOrUpdate(socialUser, user.id);
  }

  /**
   * create user
   * @param CreateUserDto
   * @returns
   */
  async createUser(createUserDto: CreateUserDto) {
    const userExists = await this.findByEmail(createUserDto.email);
    if (userExists)
      throw new BadRequestException(
        'User already added with this email address',
      );

    const role = await this.roleService.findByUniqueId(
      createUserDto.roleUniqueId,
    );

    if (!role) throw new BadRequestException('Invalid role');

    return this.create(createUserDto, role);
  }

  /**
   * Create user
   * @param createUserDto
   * @param role
   * @returns
   */
  async create(createUserDto: CreateUserDto, role: Role) {
    const userUniqueId = await generateUniqueId('U');

    return this.userRepository.save(
      this.userRepository.create({
        ...createUserDto,
        userUniqueId,
        role: { id: role.id },
      }),
    );
  }

  /**
   * Update user
   * @param updateUserDto
   * @param userUniqueId
   */
  async updateUser(updateUserDto: UpdateUserDto, userUniqueId: string) {
    const user = await this.findByUniqueId(userUniqueId);

    if (!user) throw new BadRequestException('Invalid user');

    const userEmailDuplication = await this.findByEmail(
      updateUserDto.email,
      userUniqueId,
    );

    if (userEmailDuplication)
      throw new BadRequestException(
        'User already exists with this email address',
      );

    const role = await this.roleService.findByUniqueId(
      updateUserDto.roleUniqueId,
    );

    if (!role) throw new BadRequestException('Invalid role');

    return this.userRepository.save(
      this.userRepository.create({
        ...updateUserDto,
        role: { id: role.id },
        id: user.id,
      }),
    );
  }

  /**
   * Import and create users
   * @param csvFile
   * @param importUserDto
   * @returns
   */
  async importAndCreateUsers(csvFile, importUserDto) {
    const storeInDatabase = importUserDto.storeInDatabase
      ? importUserDto.storeInDatabase
      : 'false';

    if (!csvFile) throw new BadRequestException('Please upload csv file');

    if (!xlsxFileFilter(csvFile)) {
      throw new BadRequestException('Only xlsx files are allowed!');
    }

    // add csv file extension validation here
    const filename = await uploadFile('user-imports', csvFile);

    const filePath = join(__dirname, '../../..', `public/storage/${filename}`);

    const rows = await readXlsxFile(filePath);

    let errorMessage = '';
    const errors = [];

    if (rows.length === 0) {
      errors.push(`No data was found.`);
      return {
        errorMessage: null,
        error: errors,
        successMessage: null,
      };
    }

    const isEmail =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    let createdUserCount = 0;
    let errorUserCount = 0;

    await Promise.all(
      rows.map(async (wholeRow) => {
        if (!wholeRow.every((e) => e === null) && wholeRow) {
          // add user record

          const row = classToPlain(wholeRow);
          const email = row[0];
          const roleName = row[1];
          const userExists = await this.findByEmail(email);

          if (userExists) {
            errorUserCount++;
            errors.push(`${email}: user exists`);
          } else {
            if (isEmail.test(email)) {
              const role = await this.roleService.findByWorkspaceIdAndRoleName(
                importUserDto.workspaceUniqueId,
                roleName,
              );
              if (!role) {
                errorUserCount++;
                errors.push(`${email}: invalid role - ${roleName}`);
              } else {
                createdUserCount++;
                if (storeInDatabase === 'true') {
                  // create account here
                  await this.create(
                    {
                      email: email,
                      roleUniqueId: role.roleUniqueId,
                    },
                    role,
                  );
                }
              }
            } else {
              errorUserCount++;
              errors.push(`${email}: invalid email`);
            }
          }
        }
      }),
    );

    deleteFile(filename);

    const successMessage =
      createdUserCount > 0
        ? `${createdUserCount} account(s) will be created.`
        : `No accounts will be created.`;

    if (errorUserCount > 0)
      errorMessage = `Error to create ${errorUserCount} account(s).`;

    return {
      errorMessage: errorMessage ? errorMessage : null,
      errors,
      successMessage: successMessage ? successMessage : null,
      isSuccess: createdUserCount > 0 ? true : false,
    };
  }

  /**
   * User listing
   * @param auth
   * @param options
   * @param workspaceUniqueId
   * @param search
   * @returns
   */
  async userList(
    auth: any,
    options: IPaginationOptions,
    workspaceUniqueId: string,
    search: string,
  ) {
    const queryBuilder = this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'r')
      .leftJoin('r.workspace', 'w')
      .loadRelationCountAndMap(
        'u.taskCompleted',
        'u.totalTasks',
        'task',
        (qb) =>
          qb.where('task.status = :status', { status: TASK_STATUS.COMPLETED }),
      )
      .loadRelationCountAndMap('u.taskAssigned', 'u.totalTasks')
      .where('w.workspaceUniqueId =:workspaceUniqueId', {
        workspaceUniqueId: workspaceUniqueId,
      });

    if (auth.role === 'SuperAdmin') {
      queryBuilder.andWhere('w.superAdminId =:id', { id: auth.id });
    }

    if (auth.role === 'Admin') {
      // queryBuilder.andWhere('r.adminId =:id', { id: auth.id });
    }

    if (search && search !== 'undefined') {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('u.email LIKE :search', { search: `%${search}%` })
            .orWhere('u.name LIKE :search', { search: `%${search}%` })
            .orWhere('u.role LIKE :search', { search: `%${search}%` });
        }),
      );
    }

    queryBuilder.orderBy('u.createdAt', 'DESC');

    return await paginate<Users>(queryBuilder, options);
  }

  /**
   * Delete user
   * @param userUniqueId
   * @param id
   * @returns
   */
  async deleteUser(userUniqueId: string) {
    const user = await this.userRepository.findOne({
      where: { userUniqueId: userUniqueId },
    });

    if (!user) throw new ConflictException('user not found');

    await this.userRepository.delete({
      userUniqueId: userUniqueId,
    });
  }

  /**
   * Get workspace by role and user
   * @param userUniqueId
   * @returns
   */
  async getWorkspaceByRoleAndUser(userUniqueId: string) {
    return await this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'r')
      .leftJoinAndSelect('r.workspace', 'w')
      .where('userUniqueId = :userUniqueId', { userUniqueId })
      .getOne();
  }

  /**
   * export users
   * @param workspaceUniqueId
   * @returns
   */
  async exportUserDetails(workspaceUniqueId: string): Promise<any> {
    const users = await this.userRepository.find({
      where: {
        role: { workspace: { workspaceUniqueId: workspaceUniqueId } },
      },
    });

    if (!users || users.length <= 0) {
      throw new BadRequestException('No users found');
    }

    return await createXlsxFile(
      users,
      `users_${workspaceUniqueId}`,
      EXPORT_FILENAME.USER_MODULE,
    );
  }
}
