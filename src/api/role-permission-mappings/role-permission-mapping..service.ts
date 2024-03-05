import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionService } from '../permissions/permission.service';
import { UsersService } from '../users/users.service';
import { RolePermissionMapping } from './entities/role-permission-mapping.entity';
import { PermissionModules } from 'src/common/constants';

@Injectable()
export class RolePermissionMappingService {
  constructor(
    @InjectRepository(RolePermissionMapping)
    private rolePermissionMappingRepository: Repository<RolePermissionMapping>,

    private permissionService: PermissionService,

    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  /**
   * Find mapping by permission id and role id
   * @param permissionId
   * @param roleId
   * @returns
   */
  async findByPermissionAndRoleId(permissionId: number, roleId: number) {
    return this.rolePermissionMappingRepository
      .createQueryBuilder('rpm')
      .where('permissionId = :permissionId', { permissionId })
      .andWhere('roleId = :roleId', { roleId })
      .getOne();
  }

  /**
   * Authorixe role mapping permissions
   * @param roleId
   * @returns
   */
  async authorizeRoleMappingPermissions(roleId: number) {
    const newPermissions = await this.rolePermissionMappingRepository
      .createQueryBuilder('rpm')
      .where('rpm.newOperationsRequested IS NOT NULL')
      .andWhere('roleId = :roleId', { roleId })
      .getMany();

    await Promise.all(
      newPermissions.map(async (p) => {
        return await this.rolePermissionMappingRepository.save(
          this.rolePermissionMappingRepository.create({
            ...(p && { id: p.id }),
            operations: p.newOperationsRequested,
            newOperationsRequested: null,
          }),
        );
      }),
    );

    return newPermissions;
  }

  /**
   * Find one by id
   * @param id
   * @returns
   */
  async findOne(id: number) {
    return this.rolePermissionMappingRepository
      .createQueryBuilder('rpm')
      .where('id = :id', { id })
      .getOne();
  }

  /**
   * Create or update permissions
   * @param rolePermissionMapping
   * @param rolePermission
   * @param role
   * @returns
   */
  async createOrUpdate(rolePermissionMapping, rolePermission, role) {
    const permission = await this.permissionService.findOne(rolePermission.id);
    let isPermissionUpdated = false;

    if (rolePermissionMapping) {
      if (
        JSON.stringify(rolePermissionMapping.operations) !=
        JSON.stringify(rolePermission.operations)
      ) {
        isPermissionUpdated = true;
      }
      await this.rolePermissionMappingRepository.save(
        this.rolePermissionMappingRepository.create({
          newOperationsRequested: rolePermission.operations,
          ...(rolePermissionMapping && { id: rolePermissionMapping.id }),
        }),
      );
    } else {
      //create
      if (permission) {
        await this.rolePermissionMappingRepository.save(
          this.rolePermissionMappingRepository.create({
            permission: { id: permission.id },
            ...(permission.name === PermissionModules.TASK_MODULE && {
              operations: rolePermission.operations,
            }),
            ...(permission.name != PermissionModules.TASK_MODULE && {
              newOperationsRequested: rolePermission.operations,
            }),
            role: { id: role.id },
          }),
        );
        isPermissionUpdated = true;
      }
    }

    return isPermissionUpdated;
  }

  /**
   * Find permissions by role name and Module
   * @param roleName
   * @param moduleName
   * @returns
   */
  async findPermissionsByRoleNameAndModule(
    roleName: string,
    moduleName: string,
  ) {
    const role = await this.rolePermissionMappingRepository
      .createQueryBuilder('prm')
      .leftJoinAndSelect('prm.role', 'r')
      .leftJoinAndSelect('prm.permission', 'p')
      .where('r.roleName like :name', { name: `%${roleName}%` })
      .andWhere('p.name like :permissionName', {
        permissionName: `%${moduleName}%`,
      })
      .getOne();

    if (role) return role.operations ? role.operations : [];
    return [];
  }

  /**
   * Find permissions by role name and userUniqueId
   * @param roleName
   * @param userUniqueId
   * @returns
   */
  async findPermissionsByRoleName(roleName: string, userUniqueId: string) {
    const rolePermissions = await this.rolePermissionMappingRepository
      .createQueryBuilder('prm')
      .leftJoinAndSelect('prm.role', 'r')
      .leftJoinAndSelect('prm.permission', 'p')
      .where('r.roleName like :name', { name: `%${roleName}%` })
      .getMany();

    const user = await this.usersService.getWorkspaceByRoleAndUser(
      userUniqueId,
    );

    return { rolePermissions, workspace: user?.role?.workspace };
  }
}
