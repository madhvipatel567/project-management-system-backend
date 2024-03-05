import { Workspace } from './../workspaces/entities/workspace.entity';
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { Role } from './entities/role.entity';
import { EditRoleDto } from './dto/edit-role.dto';
import { Admin } from '../admin/entities/admin.entity';
import { generateUniqueId } from 'src/common/helper/common.helper';
import { SuperAdmin } from '../super-admin/entities/super-admin.entity';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { PermissionService } from '../permissions/permission.service';
import { RolePermissionMappingService } from '../role-permission-mappings/role-permission-mapping..service';
import { CreateOrUpdateRolePermissionMappingDto } from '../role-permission-mappings/dto/role-permission-mapping.dto';
import { WorkspaceService } from '../workspaces/workspace.service';
import { Operations, PermissionModules } from 'src/common/constants';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    private permissionsService: PermissionService,

    @Inject(forwardRef(() => RolePermissionMappingService))
    private rolePermissionMappingService: RolePermissionMappingService,

    private workspaceService: WorkspaceService,
  ) {}

  /**
   * Create role
   * @param authAdmin
   * @param createRoleDto
   * @returns
   */
  async createRole(authAdmin: Admin, createRoleDto: CreateRoleDto) {
    const role = await this.roleRepository.findOne({
      where: {
        roleName: createRoleDto.roleName.trim(),
        admin: { id: authAdmin.id },
        workspace: { workspaceUniqueId: createRoleDto.workspaceUniqueId },
      },
    });

    if (role) {
      throw new BadRequestException('Role with this name already exists');
    }

    const roleUniqueId = await generateUniqueId('R');

    const workspace = await this.workspaceService.findOne(
      createRoleDto.workspaceUniqueId,
    );

    if (!workspace) throw new BadRequestException('Workspace not found!');

    const createdRole = await this.roleRepository.save(
      this.roleRepository.create({
        ...createRoleDto,
        roleUniqueId,
        admin: authAdmin,
        workspace: workspace,
        isAuthorized: false,
      }),
    );

    const permissions = await this.permissionsService.findAll();

    const newPermissions = [];
    await Promise.all(
      permissions.map((permission) => {
        if (permission.name === PermissionModules.TASK_MODULE) {
          newPermissions.push({
            ...permission,
            ...{ operations: [Operations.READ] },
          });
        } else {
          newPermissions.push({
            ...permission,
            ...{ operations: [] },
          });
        }
      }),
    );

    await this.updatePermissionsByRole(authAdmin, createdRole.roleUniqueId, {
      rolePermissions: newPermissions,
    });
  }

  /**
   * Role list
   * @param authAdmin
   * @returns
   */
  async roleList(
    authAdmin: Admin,
    options: IPaginationOptions,
    workspaceUniqueId: string,
  ) {
    const queryBuilder = this.roleRepository
      .createQueryBuilder('r')
      .where('adminId =:id', { id: authAdmin.id })
      .leftJoinAndSelect('r.workspace', 'w')
      .loadRelationCountAndMap('r.totalUsers', 'r.totalUsers')
      .where('w.workspaceUniqueId =:workspaceUniqueId', {
        workspaceUniqueId: workspaceUniqueId,
      })
      .orderBy('r.createdAt', 'DESC');

    return await paginate<Role>(queryBuilder, options);
  }

  /**
   * Role list
   * @param authAdmin
   * @returns
   */
  async roleListByWorkspaces(
    superAdmin: SuperAdmin,
    options: IPaginationOptions,
    workspaceUniqueId: string,
    search: string,
  ) {
    const queryBuilder = this.roleRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.workspace', 'w')
      .where('w.workspaceUniqueId =:workspaceUniqueId', {
        workspaceUniqueId: workspaceUniqueId,
      })
      .loadRelationCountAndMap('r.totalUsers', 'r.totalUsers')
      .leftJoinAndSelect('w.superAdmin', 'sa')
      .andWhere('sa.id =:superAdminId', {
        superAdminId: superAdmin.id,
      });

    if (search && search !== 'undefined') {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('r.roleName LIKE :search', {
            search: `%${search}%`,
          }).orWhere('r.roleDescription LIKE :search', {
            search: `%${search}%`,
          });
        }),
      );
    }

    queryBuilder.orderBy('r.createdAt', 'DESC');

    return await paginate<Role>(queryBuilder, options);
  }

  /**
   * get all role lists
   * @param authAdmin
   * @param workspaceUniqueId
   * @param options
   * @returns
   */
  async roleAllList(
    authAdmin: Admin,
    workspaceUniqueId: string,
    options: IPaginationOptions,
  ) {
    const queryBuilder = this.roleRepository
      .createQueryBuilder('r')
      .where('adminId =:id', { id: authAdmin.id })
      .leftJoinAndSelect('r.workspace', 'w')
      .loadRelationCountAndMap('r.totalUsers', 'r.totalUsers')
      .where('w.workspaceUniqueId =:workspaceUniqueId', {
        workspaceUniqueId: workspaceUniqueId,
      })
      .orderBy('r.createdAt', 'DESC');

    return await paginate<Role>(queryBuilder, options);
  }

  /**
   * Authorise role
   * @param roleUniqueId
   * @param superAdmin
   */
  async roleAuthorize(roleUniqueId: string, superAdmin: SuperAdmin) {
    const role = await this.roleRepository.findOne({
      where: {
        roleUniqueId: roleUniqueId,
      },
    });

    if (!role) throw new BadRequestException('Role not found!');

    await this.rolePermissionMappingService.authorizeRoleMappingPermissions(
      role.id,
    );

    await this.roleRepository.update(
      { roleUniqueId: roleUniqueId },
      {
        isAuthorized: true,
      },
    );
  }

  /**
   * Get role by ID
   * @param roleUniqueId
   * @returns
   */
  async getRole(roleUniqueId: string) {
    const role = await this.roleRepository.findOne({
      where: { roleUniqueId },
    });

    if (!role) {
      throw new ConflictException('Role not exists!');
    }

    return role;
  }

  /**
   * Edit role
   * @param editRoleDto
   * @param authAdmin
   * @param roleUniqueId
   * @returns
   */
  async editRole(
    editRoleDto: EditRoleDto,
    authAdmin: Admin,
    roleUniqueId: string,
  ) {
    const role = await this.roleRepository.findOne({
      where: { roleUniqueId },
    });

    if (!role) {
      throw new ConflictException('Role not exists!');
    }

    const roleExists = await this.roleRepository
      .createQueryBuilder('r')
      .where('roleName = :roleName', { roleName: editRoleDto.roleName.trim() })
      .andWhere('roleUniqueId != :roleUniqueId', { roleUniqueId })
      .getOne();

    if (roleExists)
      throw new BadRequestException('Role with this name already exists');

    await this.roleRepository.save({
      id: role.id,
      ...editRoleDto,
      admin: authAdmin,
    });
  }

  /**
   * Find by role unique ID
   * @param roleUniqueId
   * @returns
   */
  async findByUniqueId(roleUniqueId: string) {
    return this.roleRepository.findOne({
      where: { roleUniqueId },
    });
  }

  /**
   * Find by role name and workspace unique id
   * @param roleUniqueId
   * @returns
   */
  async findByWorkspaceIdAndRoleName(
    workspaceUniqueId: string,
    roleName: string,
  ) {
    return this.roleRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.workspace', 'w')
      .where('w.workspaceUniqueId =:workspaceUniqueId', {
        workspaceUniqueId: workspaceUniqueId,
      })
      .andWhere('r.roleName =:roleName', {
        roleName: roleName,
      })
      .getOne();
  }

  /**
   * delete admin
   * @param roleUniqueId
   * @returns
   */
  async deleteRole(roleUniqueId: string) {
    const role = await this.findByUniqueId(roleUniqueId);

    if (!role) throw new ConflictException('Role not found');

    await this.roleRepository.remove(role);
  }

  /**
   * Get permissions by role
   * @param superAdmin
   * @param roleUniqueId
   */
  async getPermissionsByRole(superAdmin: SuperAdmin, roleUniqueId: string) {
    const role = await this.findByUniqueId(roleUniqueId);

    if (!role) throw new BadRequestException('Role not found');

    const permissions = await this.permissionsService.findAll();

    const rolePermissions = await Promise.all(
      permissions.map(async (p) => {
        const rolePermissionMapping =
          await this.rolePermissionMappingService.findByPermissionAndRoleId(
            p.id,
            role.id,
          );

        return {
          ...p,
          operations: rolePermissionMapping
            ? role.isAuthorized
              ? rolePermissionMapping.operations
                ? rolePermissionMapping.operations
                : []
              : rolePermissionMapping.newOperationsRequested
              ? rolePermissionMapping.newOperationsRequested
              : []
            : [],
        };
      }),
    );

    return {
      role,
      rolePermissions,
    };
  }

  /**
   * Create or update role permission mappings
   * @param admin
   * @param roleUniqueId
   * @param createOrUpdateRolePermissionMappingDto
   */
  async updatePermissionsByRole(
    admin: Admin,
    roleUniqueId: string,
    createOrUpdateRolePermissionMappingDto: CreateOrUpdateRolePermissionMappingDto,
  ) {
    const role = await this.findByUniqueId(roleUniqueId);

    if (!role) throw new BadRequestException('Role not found');

    const isPermissionUpdatedArrayValues = [];

    await Promise.all(
      createOrUpdateRolePermissionMappingDto.rolePermissions.map(async (rp) => {
        const rolePermissionMapping =
          await this.rolePermissionMappingService.findByPermissionAndRoleId(
            rp.id,
            role.id,
          );

        const data = await this.rolePermissionMappingService.createOrUpdate(
          rolePermissionMapping,
          rp,
          role,
        );

        isPermissionUpdatedArrayValues.push(data);
      }),
    );

    const isPermissionUpdated =
      isPermissionUpdatedArrayValues.filter((t) => t === true).length > 0;

    if (isPermissionUpdated) {
      await this.roleRepository.update(role.id, {
        isAuthorized: false,
      });
    }
  }
}
