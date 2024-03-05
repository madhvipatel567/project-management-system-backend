import { WorkspaceAdminMapping } from './../workspace-admin-mappings/entities/workspace-admin-mapping.entity';
import {
  uploadFile,
  imageFileFilter,
  deleteFile,
} from '../../common/helper/fileupload.helper';
import { In, Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { EditWorkspaceDto } from './dto/edit-workspace.dto';
import { AdminService } from '../admin/admin.service';
import { SuperAdmin } from '../super-admin/entities/super-admin.entity';
import { WorkspaceAdminMappingService } from '../workspace-admin-mappings/workspace-admin-mapping.service';
import { generateUniqueId } from 'src/common/helper/common.helper';
import { Admin } from '../admin/entities/admin.entity';
import { ClassesAndDivisionsService } from '../classes-and-divisions/classes-and-divisions.service';
import { AcademicYear } from '../academic-years/entities/academic-year.entity';
import * as moment from 'moment';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceAdminMapping)
    private readonly workspaceAdminMappingRepository: Repository<WorkspaceAdminMapping>,

    private adminService: AdminService,
    private workspaceAdminMappingService: WorkspaceAdminMappingService,

    @Inject(forwardRef(() => ClassesAndDivisionsService))
    private classesAndDivisionsService: ClassesAndDivisionsService,

    @InjectRepository(AcademicYear)
    private academicYearRepository: Repository<AcademicYear>,
  ) {}

  /**
   * workspace list
   * @param id
   * @returns
   */
  async workspaceList(authSuperAdmin: SuperAdmin, adminUniqueId: string) {
    let workspaces = await this.workspaceRepository.find({
      where: { superAdmin: { id: authSuperAdmin.id } },
    });

    if (adminUniqueId) {
      const workspaceIds = workspaces.map((workspace) => workspace.id);
      const workspaceAdmin = await this.workspaceAdminMappingRepository.find({
        where: {
          workspace: {
            id: In(workspaceIds),
          },
          admin: {
            adminUniqueId: adminUniqueId,
          },
        },
        relations: ['workspace'],
      });

      const workspaceAdminIds = workspaceAdmin.map(
        (wAdmin) => wAdmin.workspace.id,
      );

      workspaces = await this.workspaceRepository.find({
        where: {
          id: In(workspaceAdminIds),
        },
      });
    }

    return workspaces;
  }

  /**
   * Find one by workspace unique id
   * @param workspaceUniqueId
   * @returns
   */
  async findOne(workspaceUniqueId: string) {
    return this.workspaceRepository
      .createQueryBuilder('w')
      .where('workspaceUniqueId =:workspaceUniqueId', {
        workspaceUniqueId,
      })
      .getOne();
  }

  /**
   * workspace list
   * @param id
   * @returns
   */
  async workspaceListByAdmin(admin: Admin) {
    const workspaceAdminMapping =
      await this.workspaceAdminMappingRepository.find({
        where: {
          admin: {
            id: admin.id,
          },
        },
        relations: ['workspace'],
      });

    const workspaceIds = workspaceAdminMapping.map((w) => w.workspace.id);

    if (workspaceIds.length > 0) {
      return await this.workspaceRepository.find({
        where: {
          id: In(workspaceIds),
        },
      });
    }
    return [];
  }

  /**
   * get workspace by workspace unique id
   * @param workspaceUniqueId
   * @returns
   */
  async getWorkspace(workspaceUniqueId: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { workspaceUniqueId },
    });

    if (!workspace) {
      throw new ConflictException('Workspace not exists!');
    }

    return workspace;
  }

  /**
   * create workspace
   * @param adminIds
   * @param createWorkspaceDto
   * @param authSuperAdmin
   * @param image
   * @returns
   */
  async createWorkspace(
    adminIds: string,
    createWorkspaceDto: CreateWorkspaceDto,
    authSuperAdmin: SuperAdmin,
    image: any,
  ) {
    const adminArrayIds = adminIds
      ?.split(',')
      .map((item) => Number(item.trim()));

    const workspace = await this.workspaceRepository.findOne({
      where: {
        workspaceName: createWorkspaceDto.workspaceName.trim(),
        superAdmin: { id: authSuperAdmin.id },
      },
    });

    if (workspace) {
      throw new BadRequestException('Workspace with this name already exists');
    }

    if (image) {
      if (!imageFileFilter(image)) {
        throw new BadRequestException(
          'Only image files are allowed! Ex. jpg, jpeg, png',
        );
      }
      createWorkspaceDto.image = uploadFile('workspaceImage', image);
    }

    let admins: any;
    if (adminArrayIds) admins = await this.adminService.findIdIn(adminArrayIds);

    const classes = createWorkspaceDto.classes
      ? JSON.parse(createWorkspaceDto.classes)
      : [];

    const valueArr = classes.map(function (item) {
      return item.className;
    });
    const isDuplicate = valueArr.some(function (item, idx) {
      return valueArr.indexOf(item) != idx;
    });

    if (isDuplicate)
      throw new BadRequestException('Classes name should be unique.');

    const workspaceUniqueId = await generateUniqueId('W');

    const savedWorkspace = await this.workspaceRepository.save(
      this.workspaceRepository.create({
        ...createWorkspaceDto,
        workspaceUniqueId,
        superAdmin: authSuperAdmin,
      }),
    );

    if (admins) {
      await Promise.all(
        admins.map(async (admin) => {
          await this.workspaceAdminMappingService.create(admin, savedWorkspace);
        }),
      );
    }

    if (classes.length > 0) {
      await this.classesAndDivisionsService.createMultipleClasses(
        classes,
        savedWorkspace,
      );
    }

    const academicYearUniqueId = await generateUniqueId('AY');

    if (createWorkspaceDto.label) {
      await this.academicYearRepository.save(
        this.academicYearRepository.create({
          academicYearUniqueId: academicYearUniqueId,
          label: createWorkspaceDto.label,
          from: moment(createWorkspaceDto.from).format('YYYY-MM-DD'),
          to: moment(createWorkspaceDto.to).format('YYYY-MM-DD'),
          workspace: savedWorkspace,
          isDefault: true,
        }),
      );
    }

    return savedWorkspace;
  }

  /**
   * edit workspace
   * @param editWorkspaceDto
   * @param authSuperAdmin
   * @param image
   * @param id
   * @returns
   */
  async editWorkspace(
    editWorkspaceDto: EditWorkspaceDto,
    authSuperAdmin: SuperAdmin,
    image: any,
    workspaceUniqueId: string,
  ) {
    const workspace = await this.workspaceRepository.findOne({
      where: { workspaceUniqueId },
    });

    if (!workspace) {
      throw new ConflictException('Workspace not exists!');
    }

    const workspaceExists = await this.workspaceRepository
      .createQueryBuilder('w')
      .where('workspaceName = :workspaceName', {
        workspaceName: editWorkspaceDto.workspaceName.trim(),
      })
      .andWhere('workspaceUniqueId != :workspaceUniqueId', {
        workspaceUniqueId: workspaceUniqueId,
      })
      .andWhere('superAdminId = :superAdminId', {
        superAdminId: authSuperAdmin.id,
      })
      .getOne();

    if (workspaceExists)
      throw new BadRequestException('Workspace with this name already exists');

    // Upload file
    if (image) {
      if (!imageFileFilter(image)) {
        throw new BadRequestException(
          'Only image files are allowed! Ex. jpg, jpeg, png',
        );
      }

      if (workspace.image) deleteFile(workspace.image);

      editWorkspaceDto.image = uploadFile('workspaceImage', image);
    }

    await this.workspaceRepository.save({
      id: workspace.id,
      ...editWorkspaceDto,
      superAdmin: authSuperAdmin,
    });
  }

  /**
   * Delete workspace
   * @param authSuperAdmin
   * @param id
   * @returns
   */
  async deleteWorkspace(workspaceUniqueId: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { workspaceUniqueId },
    });

    if (!workspace) throw new ConflictException('workspace not found');

    deleteFile(workspace.image);

    await this.workspaceRepository.delete(workspace);
  }
}
