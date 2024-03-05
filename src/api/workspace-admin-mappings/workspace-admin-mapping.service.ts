import { Workspace } from 'src/api/workspaces/entities/workspace.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkspaceAdminMapping } from './entities/workspace-admin-mapping.entity';
import { Admin } from '../admin/entities/admin.entity';

@Injectable()
export class WorkspaceAdminMappingService {
  constructor(
    @InjectRepository(WorkspaceAdminMapping)
    private readonly workspaceAdminMappingRepository: Repository<WorkspaceAdminMapping>,
  ) {}

  /**
   * Map admin with workspace
   * @param admin
   * @param workspace
   * @returns
   */
  async create(admin: Admin, workspace: Workspace) {
    return this.workspaceAdminMappingRepository.save(
      this.workspaceAdminMappingRepository.create({
        admin,
        workspace,
      }),
    );
  }

  /**
   * Remove mapping admin with workspace
   * @param admin
   * @param workspace
   * @returns
   */
  async remove(admin: Admin, workspace: Workspace) {
    const workspaceAdmin = await this.workspaceAdminMappingRepository
      .createQueryBuilder('wa')
      .leftJoinAndSelect('wa.admin', 'a')
      .where('a.id =:adminId', { adminId: admin.id })
      .leftJoinAndSelect('wa.workspace', 'w')
      .andWhere('w.id =:workspaceId', { workspaceId: workspace.id })
      .getOne();

    return await this.workspaceAdminMappingRepository.delete(workspaceAdmin.id);
  }

  /**
   * Workspace list
   * @param authAdmin
   * @returns
   */
  async getWorkspacesByAdmin(authAdmin: Admin) {
    const workspaces = await this.workspaceAdminMappingRepository
      .createQueryBuilder('r')
      .where('r.adminId =:id', { id: authAdmin.id })
      .orderBy('r.createdAt', 'DESC')
      .getMany();

    return workspaces;
  }
}
