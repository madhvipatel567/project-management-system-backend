import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { Roles } from 'src/common/decorators/permissions.decorator';
import {
  generateMeta,
  generateUniqueId,
} from 'src/common/helper/common.helper';
import { IUploadedFile } from 'src/common/interfaces/uploaded-file.interface';
import {
  Brackets,
  DataSource,
  In,
  IsNull,
  LessThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { TaskAttachmentsService } from '../task-attachments/task-attachments.service';
import { TaskTagsService } from '../task-tags/task-tags.service';
import { TeamsService } from '../teams/teams.service';
import { UsersService } from '../users/users.service';
import { WorkspaceService } from '../workspaces/workspace.service';
import { CreateTaskDto } from './dto/create-task.dto';
import {
  INTERVALS,
  Task,
  TASK_PRIORITY,
  TASK_STATUS,
} from './entities/task.entity';
import { without } from 'lodash';
import { MEDIA_TYPES } from '../task-attachments/entities/task-attachment.entity';
import {
  castToStorage,
  createXlsxFile,
  deleteFile,
  uploadFile,
  xlsxFileFilter,
} from 'src/common/helper/fileupload.helper';
import { TeamUserMappingService } from '../team-user-mappings/team-user-mapping.service';
import { UpdateTaskDto } from './dto/update-task.dto';
import { join } from 'path';
import readXlsxFile from 'read-excel-file/node';
import { classToPlain } from 'class-transformer';
import { ImportTaskDto } from './dto/import-task.dto';
import {
  EXPORT_FILENAME,
  Operations,
  PermissionModules,
  SENDGRID_TEMPLATES,
} from 'src/common/constants';
import { RolePermissionMappingService } from '../role-permission-mappings/role-permission-mapping..service';
import { FilterTaskDto } from './dto/filter-task.dto';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { Cron } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';
import { TeamHierarchyService } from '../team-hierarchy/team-hierarchy.service';
import { TaskActivitiesService } from '../task-activities/task-activities.service';
import { activityType } from '../task-activities/entities/task-activity.entity';
import * as fs from 'fs';
import * as archiver from 'archiver';
import mysqldump from 'mysqldump';
import { AcademicYear } from '../academic-years/entities/academic-year.entity';
import { AcademicYearsService } from '../academic-years/academic-years.service';
import { SendgridService } from 'src/common/services/sendgrid.service';
import { Team } from '../teams/entities/team.entity';
import { Users } from '../users/entities/user.entity';
import { TeamUserMapping } from '../team-user-mappings/entities/team-user-mapping.entity';
import { ConfigService } from '@nestjs/config';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @Inject(forwardRef(() => TaskAttachmentsService))
    private taskAttachmentsService: TaskAttachmentsService,
    private taskTagsService: TaskTagsService,
    private teamUserMappingService: TeamUserMappingService,
    private usersService: UsersService,

    @Inject(forwardRef(() => TeamsService))
    private teamsService: TeamsService,

    private teamHierarchyService: TeamHierarchyService,

    private workspaceService: WorkspaceService,
    private rolePermissionMappingService: RolePermissionMappingService,

    private dataSource: DataSource, // private readonly logger = new Logger(),
    private mailerService: MailerService,

    @Inject(forwardRef(() => TaskActivitiesService))
    private taskActivitiesService: TaskActivitiesService,

    @InjectRepository(AcademicYear)
    private academicYearRepository: Repository<AcademicYear>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,

    private academicYearsService: AcademicYearsService,
    private sendgridService: SendgridService,
    private configService: ConfigService,
  ) {}

  /**
   * Create task
   */
  async create(
    createTaskDto: CreateTaskDto,
    authUser,
    attachments?: IUploadedFile[],
  ) {
    if (![Roles.ADMIN, Roles.SUPERADMIN].includes(authUser.role)) {
      const rolePermissions =
        await this.rolePermissionMappingService.findPermissionsByRoleNameAndModule(
          authUser.role,
          PermissionModules.TASK_MODULE,
        );

      if (
        (createTaskDto.assignedToTeamUniqueId ||
          createTaskDto.assignedToUserUniqueId) &&
        !rolePermissions.includes(Operations.ASSIGN)
      ) {
        throw new BadRequestException(
          `You don't have permissions to assign tasks.`,
        );
      }
    }

    const workspace = await this.workspaceService.findOne(
      createTaskDto.workspaceUniqueId,
    );

    if (!workspace) throw new BadRequestException('Workspace not exists');

    if (attachments && attachments.length) {
      const { isSizeValid, isExtensionValid } =
        await this.taskAttachmentsService.checkValidFile(attachments);
      if (!isSizeValid)
        throw new BadRequestException('Upload files less than 25mb');

      if (!isExtensionValid)
        throw new BadRequestException(
          'Only images, PDFs, documents, and videos are allowed.',
        );
    }

    let isSendAssignMail = false;
    let user = null;
    if (createTaskDto.assignedToUserUniqueId) {
      user = await this.usersService.findByUniqueId(
        createTaskDto.assignedToUserUniqueId,
      );

      if (!user)
        throw new BadRequestException('Please select user or team to assign');

      isSendAssignMail = true;
    }

    let team = null;
    if (createTaskDto.assignedToTeamUniqueId) {
      team = await this.teamsService.findOneByUniqueId(
        createTaskDto.assignedToTeamUniqueId,
      );

      if (!team)
        throw new BadRequestException('Please select user or team to assign');

      isSendAssignMail = true;
    }

    let parentTask = null;
    if (createTaskDto.parentTaskUniqueId) {
      parentTask = await this.findOneByUniqueId(
        createTaskDto.parentTaskUniqueId,
      );

      if (!parentTask) throw new BadRequestException('Task not exists');
    }

    const taskUniqueId = await generateUniqueId('T');

    const time = moment
      .unix(createTaskDto.endingDateTime)
      .utc()
      .format('hh:mm:ss');
    // console.log(time);

    const academicYear = await this.academicYearRepository.findOne({
      where: { id: createTaskDto.academicYear },
    });

    if (!academicYear)
      throw new BadRequestException('Academic year not exists');

    const task: Task = await this.taskRepo.save({
      ...createTaskDto,
      workspace: { id: workspace.id },
      taskUniqueId,
      ...(createTaskDto.startingDateTime && {
        startingDateTime: moment.unix(createTaskDto.startingDateTime).toDate(),
      }),
      ...(createTaskDto.endingDateTime && {
        endingDateTime: moment.unix(createTaskDto.endingDateTime).toDate(),
      }),
      ...(authUser.role === Roles.ADMIN && {
        createdByAdmin: { id: authUser.id },
      }),
      ...(authUser.role === Roles.SUPERADMIN && {
        createdBySuperAdmin: { id: authUser.id },
      }),
      ...(![Roles.ADMIN, Roles.SUPERADMIN].includes(authUser.role) && {
        createdByUser: authUser,
      }),
      ...(team &&
        createTaskDto.assignedToTeamUniqueId && {
          assignedToTeam: { id: team.id },
        }),
      ...(user &&
        createTaskDto.assignedToUserUniqueId && {
          assignedToUser: { id: user.id },
        }),
      ...(parentTask &&
        createTaskDto.parentTaskUniqueId && {
          parent: { id: parentTask.id },
        }),
      status: TASK_STATUS.ASSIGNED,
      isArchived: createTaskDto.isArchived
        ? createTaskDto.isArchived === 'true'
        : false,
      ...(createTaskDto.endingDateTime &&
        createTaskDto.repetitionInterval &&
        createTaskDto.repetitionIntervalNumber && {
          lastRepeatedAt: `${moment
            .unix(createTaskDto.endingDateTime)
            .format('YYYY-MM-DD')} ${time}`,
        }),
      academicYear: academicYear,
    });

    if (createTaskDto.tags) {
      await this.taskTagsService.createOrUpdate(
        JSON.parse(createTaskDto.tags),
        workspace,
        task,
      );
    }

    if (attachments && attachments.length) {
      await this.taskAttachmentsService.uploadTaskDocuments(task, attachments);
    }

    if (parentTask)
      await this.taskActivitiesService.create(
        `<b>${authUser.name}</b> has created a subtask <b>${createTaskDto.taskName}</b>.`,
        activityType.TASK_CREATED,
        parentTask,
        authUser,
      );

    await this.taskActivitiesService.create(
      `<b>${authUser.name}</b> has created a task.`,
      activityType.TASK_CREATED,
      task,
      authUser,
    );

    // if (task.repetitionIntervalNumber) {
    //   await this.repeatTask(authUser, task);
    // }

    if (isSendAssignMail) {
      this.sendAssigningOrReminderMail(
        team,
        user,
        task,
        SENDGRID_TEMPLATES.TASK_ASSIGNMENT,
      );
    }

    return task;
  }

  /**
   * Duplicate task
   */
  async duplicateTask(
    authUser,
    taskUniqueId: string,
    isSubtask: boolean,
    isRepeat: boolean,
  ) {
    const task = await this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.parent', 'p')
      .leftJoinAndSelect('t.assignedToTeam', 'at')
      .leftJoin('t.workspace', 'w')
      .leftJoin('t.assignedToUser', 'u')
      .leftJoin('t.assignedToTeam', 'att')
      .leftJoin('t.academicYear', 'academicY')
      .addSelect([
        'u.id',
        'u.userUniqueId',
        'u.email',
        'u.name',
        'u.profilePic',
      ])
      .addSelect([
        'academicY.id',
        'academicY.label',
        'academicY.from',
        'academicY.to',
        'academicY.createdAt',
        'academicY.isDefault',
      ])
      .addSelect(['w.id', 'w.workspaceUniqueId', 'w.workspaceName'])
      .addSelect(['att.id', 'att.teamUniqueId', 'att.teamName'])
      .where('t.taskUniqueId = :taskUniqueId', { taskUniqueId })
      .getOne();

    if (!task) throw new BadRequestException('Task not found');

    const duplicatedTaskUniqueId = await generateUniqueId('T');

    const taskId = task.id;
    delete task.id;
    delete task.createdAt;
    delete task.updatedAt;

    const duplicatedTask: Task = await this.taskRepo.save({
      ...task,
      taskUniqueId: duplicatedTaskUniqueId,
      parent: isSubtask ? task?.parent : null,
      status: TASK_STATUS.ASSIGNED,
      ...(authUser.role === Roles.ADMIN && {
        createdByAdmin: { id: authUser.id },
      }),
      ...(authUser.role === Roles.SUPERADMIN && {
        createdBySuperAdmin: { id: authUser.id },
      }),
      ...(![Roles.ADMIN, Roles.SUPERADMIN].includes(authUser.role) && {
        createdByUser: authUser,
      }),
      isRepeat: isRepeat,
    });

    const taskAttachments = await this.taskAttachmentsService.findAllByTaskId(
      taskId,
    );

    if (taskAttachments.length) {
      await this.taskAttachmentsService.copyTaskDocuments(
        duplicatedTask,
        taskAttachments,
      );
    }

    const tags = await this.taskTagsService.findTaskTags(taskId);

    if (tags.length) {
      await this.taskTagsService.createOrUpdate(
        tags,
        duplicatedTask.workspace,
        duplicatedTask,
      );
    }

    await this.taskActivitiesService.create(
      `<b>${authUser.name}</b> has duplicated a task.`,
      activityType.TASK_CREATED,
      task,
      authUser,
    );

    return duplicatedTask;
  }

  /**
   * Repeat task
   */
  async repeatTask(repeatedTask: Task, next: boolean) {
    const createdBy: any =
      repeatedTask.createdByAdmin ||
      repeatedTask.createdBySuperAdmin ||
      repeatedTask.createdByUser;

    let user = Roles.ROLE_BASED_USER;
    if (repeatedTask.createdByAdmin) {
      user = Roles.ADMIN;
    }
    if (repeatedTask.createdBySuperAdmin) {
      user = Roles.SUPERADMIN;
    }

    if (createdBy) {
      Object.assign(createdBy, { role: user });
    }

    let interval: moment.unitOfTime.DurationConstructor = 'days';
    if (repeatedTask.repetitionInterval === INTERVALS.DAILY) {
      interval = 'days';
    }
    if (repeatedTask.repetitionInterval === INTERVALS.WEEKLY) {
      interval = 'weeks';
    }
    if (repeatedTask.repetitionInterval === INTERVALS.MONTHLY) {
      interval = 'months';
    }
    if (repeatedTask.repetitionInterval === INTERVALS.QUARTERLY) {
      interval = 'quarters';
    }
    if (repeatedTask.repetitionInterval === INTERVALS.YEARLY) {
      interval = 'years';
    }

    const task = await this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.parent', 'p')
      .leftJoinAndSelect('t.assignedToTeam', 'at')
      .leftJoin('t.workspace', 'w')
      .leftJoin('t.assignedToUser', 'u')
      .leftJoin('t.assignedToTeam', 'att')
      .leftJoin('t.academicYear', 'academicY')
      .addSelect([
        'u.id',
        'u.userUniqueId',
        'u.email',
        'u.name',
        'u.profilePic',
      ])
      .addSelect([
        'academicY.id',
        'academicY.label',
        'academicY.from',
        'academicY.to',
        'academicY.createdAt',
        'academicY.isDefault',
      ])
      .addSelect(['w.id', 'w.workspaceUniqueId', 'w.workspaceName'])
      .addSelect(['att.id', 'att.teamUniqueId', 'att.teamName'])
      .where('t.taskUniqueId = :taskUniqueId', {
        taskUniqueId: repeatedTask.taskUniqueId,
      })
      .getOne();

    if (!task) throw new BadRequestException('Task not found');

    const duplicatedTaskUniqueId = await generateUniqueId('T');

    const taskId = task.id;
    delete task.id;
    delete task.createdAt;
    delete task.updatedAt;
    delete task.taskUniqueId;

    if (next) {
      task.startingDateTime = moment(task.startingDateTime)
        .add(task.repetitionIntervalNumber, interval)
        .add(task.repetitionIntervalNumber, interval)
        .toDate();
      task.endingDateTime = moment(task.endingDateTime)
        .add(task.repetitionIntervalNumber, interval)
        .add(task.repetitionIntervalNumber, interval)
        .toDate();
    } else {
      task.startingDateTime = moment(task.startingDateTime)
        .add(task.repetitionIntervalNumber, interval)
        .toDate();
      task.endingDateTime = moment(task.endingDateTime)
        .add(task.repetitionIntervalNumber, interval)
        .toDate();
    }

    const duplicatedTask: Task = await this.taskRepo.save(
      this.taskRepo.create({
        ...task,
        taskUniqueId: duplicatedTaskUniqueId,
        parent: repeatedTask.parent ? task.parent : null,
        status: TASK_STATUS.ASSIGNED,
        ...(createdBy.role === Roles.ADMIN && {
          createdByAdmin: { id: createdBy.id },
        }),
        ...(createdBy.role === Roles.SUPERADMIN && {
          createdBySuperAdmin: { id: createdBy.id },
        }),
        ...(![Roles.ADMIN, Roles.SUPERADMIN].includes(createdBy.role) && {
          createdByUser: createdBy,
        }),
        isRepeat: true,
        isRepeated: true,
      }),
    );

    const taskAttachments = await this.taskAttachmentsService.findAllByTaskId(
      taskId,
    );

    if (taskAttachments.length) {
      await this.taskAttachmentsService.copyTaskDocuments(
        duplicatedTask,
        taskAttachments,
      );
    }

    const tags = await this.taskTagsService.findTaskTags(taskId);

    if (tags.length) {
      await this.taskTagsService.createOrUpdate(
        tags,
        duplicatedTask.workspace,
        duplicatedTask,
      );
    }

    await this.taskActivitiesService.create(
      `<b>${createdBy.name}</b> has duplicated a task.`,
      activityType.TASK_CREATED,
      task,
      createdBy,
    );

    let users = null;
    if (duplicatedTask?.assignedToTeam) {
      users = await this.teamUserMappingService.getUserByTeam(
        duplicatedTask?.assignedToTeam,
      );
    }

    const userEmails = [];
    if (duplicatedTask?.assignedToUser?.email) {
      userEmails.push(duplicatedTask?.assignedToUser?.email);
    }

    if (users) {
      users?.map((user: any) => {
        userEmails.push(user.user?.email);
      });
    }

    const mail = {
      to: userEmails,
      from: '<nkarkare@taskmgr.in>',
      templateId: SENDGRID_TEMPLATES.TASK_REPETITION,
      dynamic_template_data: {
        email: userEmails,
        task: {
          ...duplicatedTask,
          taskUrl: `${this.configService.get('FRONTEND_URL')}/tasks?t=${
            duplicatedTask.taskUniqueId
          }`,
          endingDateTime: moment(duplicatedTask.endingDateTime).toString(),
        },
      },
    };

    await this.sendgridService.send(mail);

    return duplicatedTask;
  }

  /**
   * Find all the task - KANBAN view
   * @param authUser
   * @param paginationOptions
   * @param search
   * @param workspaceUniqueId
   * @returns
   */
  async findAllTasksKanbanList(
    authUser,
    paginationOptions: IPaginationOptions,
    search: string,
    workspaceUniqueId: string,
    filterTaskDto: FilterTaskDto,
  ) {
    let workspace = null;

    if (workspaceUniqueId) {
      workspace = await this.workspaceService.findOne(workspaceUniqueId);

      if (!workspace) throw new BadRequestException('Workspace not exists');
    }

    const statuses = await this.getKanbanStatuses();
    const { limit, page } = paginationOptions;
    const offset = Number(page) * Number(limit) - Number(limit);

    const data = await Promise.all(
      statuses.map(async (status) => {
        const { cards, total } = await this.getTaskList(
          status.title,
          search,
          workspace,
          { ...paginationOptions, offset },
          authUser,
          filterTaskDto,
        );

        return {
          ...status,
          cards,
          meta: generateMeta({
            totalItems: total,
            itemsPerPage: Number(limit),
            totalPages: total / Number(limit),
            currentPage: Number(page),
          }),
        };
      }),
    );

    return data;
  }

  /**
   * Get task details
   * @param taskUniqueId
   * @returns
   */
  async getTask(taskUniqueId: string, authUser) {
    const task = await this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.parent', 'p')
      .leftJoinAndSelect('t.assignedToTeam', 'at')
      .leftJoin('t.workspace', 'w')
      .leftJoin('t.assignedToUser', 'u')
      .leftJoin('t.assignedToTeam', 'att')
      .leftJoin('t.academicYear', 'academicY')
      .addSelect([
        'u.id',
        'u.userUniqueId',
        'u.email',
        'u.name',
        'u.profilePic',
      ])
      .loadRelationCountAndMap('t.totalSubtasks', 't.totalSubtasks')
      .addSelect(['w.id', 'w.workspaceUniqueId', 'w.workspaceName'])
      .addSelect(['att.id', 'att.teamUniqueId', 'att.teamName'])
      .addSelect([
        'academicY.id',
        'academicY.label',
        'academicY.from',
        'academicY.to',
        'academicY.createdAt',
        'academicY.isDefault',
      ])
      .where('t.taskUniqueId = :taskUniqueId', { taskUniqueId })
      .getOne();

    if (!task) throw new BadRequestException('Task not found');

    const isValid = await this.checkWorkspaceWithTask(authUser, task);

    if (!isValid) {
      throw new BadRequestException('Task is not valid');
    }

    const taskAttachments = await this.taskAttachmentsService.findAllByTaskId(
      task.id,
    );

    const taskCompletedAttachments =
      await this.taskAttachmentsService.findAllByTaskId(task.id, true);

    const tags = await this.taskTagsService.findTaskTags(task.id);

    let teamUsers = [];
    if (task.assignedToTeam) {
      teamUsers = await this.teamUserMappingService.getAllUsersByTeamId(
        task.assignedToTeam.id,
      );
    }

    Object.assign(task, {
      taskAttachments,
      taskCompletedAttachments,
      tags,
      teamUsers,
    });

    return task;
  }

  async checkWorkspaceWithTask(authUser, task) {
    if (authUser.role === Roles.SUPERADMIN) {
      const workspace = await this.workspaceRepository.findOne({
        where: { superAdmin: { id: authUser.id } },
      });

      if (workspace) {
        if (!(workspace.id === task.workspace.id)) {
          return false;
        }
      } else {
        return false;
      }
    }

    if (authUser.role === Roles.ADMIN) {
      const workspaces = await this.workspaceService.workspaceListByAdmin(
        authUser,
      );

      if (workspaces) {
        let flag = false;
        workspaces?.map((workspace) => {
          if (workspace.id === task.workspace.id) {
            flag = true;
          }
        });

        if (!flag) {
          return false;
        }
      } else {
        return false;
      }
    }

    if (![Roles.ADMIN, Roles.SUPERADMIN].includes(authUser.role)) {
      const user = await this.usersService.findUserWithRole(authUser.id);

      if (user) {
        const role = await this.roleRepository.findOne({
          where: { id: user.role.id },
          relations: ['workspace'],
        });

        if (!(role.workspace.id === task.workspace.id)) {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  }

  /**
   * Get subtasks
   * @param taskUniqueId
   * @param options
   * @returns
   */
  async getSubTasks(taskUniqueId: string, options: IPaginationOptions) {
    const queryBuilder = this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.parent', 'p')
      .leftJoinAndSelect('t.assignedToTeam', 'at')
      .leftJoin('t.workspace', 'w')
      .leftJoin('t.assignedToUser', 'u')
      .leftJoin('t.assignedToTeam', 'att')
      .leftJoin('t.academicYear', 'academicY')
      .addSelect([
        'u.id',
        'u.userUniqueId',
        'u.email',
        'u.name',
        'u.profilePic',
      ])
      .addSelect([
        'academicY.id',
        'academicY.label',
        'academicY.from',
        'academicY.to',
        'academicY.createdAt',
        'academicY.isDefault',
      ])
      .loadRelationCountAndMap('t.totalSubtasks', 't.totalSubtasks')
      .addSelect(['w.id', 'w.workspaceUniqueId', 'w.workspaceName'])
      .addSelect(['att.id', 'att.teamUniqueId', 'att.teamName'])
      .where('p.taskUniqueId = :taskUniqueId', { taskUniqueId });

    queryBuilder.orderBy('t.createdAt', 'DESC');

    const { items: data, meta } = await paginate<Task>(queryBuilder, options);

    const tasks = await Promise.all(
      data.map(async (task) => {
        const taskAttachments =
          await this.taskAttachmentsService.findAllByTaskId(task.id);

        const taskCompletedAttachments =
          await this.taskAttachmentsService.findAllByTaskId(task.id, true);

        const tags = await this.taskTagsService.findTaskTags(task.id);

        let teamUsers = [];
        if (task.assignedToTeam) {
          teamUsers = await this.teamUserMappingService.getAllUsersByTeamId(
            task.assignedToTeam.id,
          );
        }

        Object.assign(task, {
          taskAttachments,
          taskCompletedAttachments,
          tags,
          teamUsers,
        });

        return task;
      }),
    );

    return { items: tasks, meta };
  }

  /**
   * Get tasks by team
   * @param teamUniqueId
   * @param status
   * @param options
   * @returns
   */
  async getTasksByTeam(
    teamUniqueId: string,
    isAssigned: string,
    isDue: string,
    isInProgress: string,
    isCompleted: string,
    options: IPaginationOptions,
  ) {
    const team = await this.teamsService.findOneByUniqueId(teamUniqueId);

    if (!team) throw new BadRequestException('Team not found');

    const teamHierarchy = await this.teamHierarchyService.findAllByTeamId(
      team.id,
    );

    const teamh = classToPlain(teamHierarchy);

    const teamUniqueIds = teamh.map((th) => th.team && th.team.teamUniqueId);
    teamUniqueIds.push(teamUniqueId);

    const queryBuilder = this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.parent', 'p')
      .leftJoinAndSelect('t.assignedToTeam', 'att')
      .loadRelationCountAndMap('t.totalSubtasks', 't.totalSubtasks')
      .where('att.teamUniqueId IN (:...teamUniqueIds)', { teamUniqueIds });

    if (isAssigned === 'true' || isAssigned === '1') {
      queryBuilder.andWhere('t.status =:statusAssigned', {
        statusAssigned: TASK_STATUS.ASSIGNED,
      });
    }

    if (isInProgress === 'true' || isInProgress === '1') {
      queryBuilder.andWhere('t.status =:statusStarted', {
        statusStarted: TASK_STATUS.STARTED,
      });
    }

    if (isCompleted === 'true' || isCompleted === '1') {
      queryBuilder.andWhere('t.status =:statusCompleted', {
        statusCompleted: TASK_STATUS.COMPLETED,
      });
    }

    if (isDue === 'true' || isDue === '1') {
      queryBuilder
        .andWhere('t.endingDateTime <=:endingDateTime', {
          endingDateTime: moment().utc().format('YYYY-MM-DD'),
        })
        .andWhere('t.status !=:statusComplete', {
          statusComplete: TASK_STATUS.COMPLETED,
        });
    }

    queryBuilder.orderBy('t.createdAt', 'DESC');

    return await paginate<Task>(queryBuilder, options);
  }

  /**
   * Get all task by team unique id
   * @param teamUniqueId
   */
  async getAllTasksByTeam(teamUniqueId) {
    return this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.assignedToTeam', 'att')
      .where('att.teamUniqueId = :teamUniqueId', { teamUniqueId })
      .getMany();
  }

  /**
   * Find all the task - KANBAN view pagination
   * @param authUser
   * @param paginationOptions
   * @param search
   * @param workspaceUniqueId
   * @returns
   */
  async findAllTasksKanbanPaginationList(
    authUser,
    paginationOptions: IPaginationOptions,
    search: string,
    workspaceUniqueId: string,
    status: string,
    filterTaskDto: FilterTaskDto,
  ) {
    let workspace = null;

    if (workspaceUniqueId) {
      workspace = await this.workspaceService.findOne(workspaceUniqueId);

      if (!workspace) throw new BadRequestException('Workspace not exists');
    }

    const { limit, page } = paginationOptions;
    const offset = Number(page) * Number(limit) - Number(limit);

    const { cards, total } = await this.getTaskList(
      status,
      search,
      workspace,
      {
        ...paginationOptions,
        offset,
      },
      authUser,
      filterTaskDto,
    );

    return {
      data: cards,
      meta: generateMeta({
        totalItems: total,
        itemsPerPage: Number(limit),
        totalPages: total / Number(limit),
        currentPage: Number(page),
      }),
    };
  }

  /**
   * Update tasks
   * @param authUser
   * @param updateTaskDto
   * @param taskUniqueId
   * @param attachments
   * @returns
   */
  async updateTask(
    authUser,
    updateTaskDto: UpdateTaskDto,
    taskUniqueId: string,
    attachments: IUploadedFile[],
  ) {
    const task = await this.findOneByUniqueId(taskUniqueId);
    if (!task) throw new BadRequestException('Task not found');

    // console.log(
    //   task.reminderInterval != updateTaskDto.reminderInterval ||
    //     task.reminderIntervalNumber !=
    //       Number(updateTaskDto.reminderIntervalNumber),
    // );

    if (
      task.status != TASK_STATUS.COMPLETED &&
      updateTaskDto.status === TASK_STATUS.COMPLETED
    ) {
      const subtasks = await this.taskRepo
        .createQueryBuilder('t')
        .where('parentId = :parentId', { parentId: task.id })
        .getMany();

      const statuses = subtasks.filter(
        (st) => st.status === TASK_STATUS.COMPLETED && st,
      );

      if (subtasks.length != statuses.length)
        throw new BadRequestException(
          'Please complete all the subtasks before completing the current task.',
        );
    }

    const workspace = await this.workspaceService.findOne(
      updateTaskDto.workspaceUniqueId,
    );

    if (!workspace) throw new BadRequestException('Workspace not exists');

    if (attachments && attachments.length) {
      const { isSizeValid, isExtensionValid } =
        await this.taskAttachmentsService.checkValidFile(attachments);
      if (!isSizeValid)
        throw new BadRequestException('Upload files less than 25mb');

      if (!isExtensionValid)
        throw new BadRequestException(
          'Only images, PDFs, documents, and videos are allowed.',
        );
    }

    let isSendAssignMail = false;
    let user = null;
    if (updateTaskDto.assignedToUserUniqueId) {
      user = await this.usersService.findByUniqueId(
        updateTaskDto.assignedToUserUniqueId,
      );

      if (!user)
        throw new BadRequestException('Please select user or team to assign');

      isSendAssignMail = true;
    }

    let team = null;
    if (updateTaskDto.assignedToTeamUniqueId) {
      team = await this.teamsService.findOneByUniqueId(
        updateTaskDto.assignedToTeamUniqueId,
      );

      if (!team)
        throw new BadRequestException('Please select user or team to assign');

      isSendAssignMail = true;
    }

    let parentTask = null;
    if (updateTaskDto.parentTaskUniqueId) {
      parentTask = await this.findOneByUniqueId(
        updateTaskDto.parentTaskUniqueId,
      );

      if (!parentTask) throw new BadRequestException('Task not exists');
    }

    const academicYear = await this.academicYearRepository.findOne({
      where: { id: updateTaskDto.academicYear },
    });

    const updatedTask: Task = await this.taskRepo.save({
      ...updateTaskDto,
      isRepeat: false,
      id: task.id,
      workspace: { id: workspace.id },
      ...(updateTaskDto.startingDateTime && {
        startingDateTime: moment.unix(updateTaskDto.startingDateTime).toDate(),
      }),
      ...(updateTaskDto.endingDateTime && {
        endingDateTime: moment.unix(updateTaskDto.endingDateTime).toDate(),
      }),
      ...(team &&
        updateTaskDto.assignedToTeamUniqueId && {
          assignedToTeam: { id: team.id },
          assignedToUser: null,
        }),
      ...(user &&
        updateTaskDto.assignedToUserUniqueId && {
          assignedToUser: { id: user.id },
          assignedToTeam: null,
        }),
      ...(parentTask &&
        updateTaskDto.parentTaskUniqueId && {
          parent: { id: parentTask.id },
        }),
      isArchived: updateTaskDto.isArchived
        ? updateTaskDto.isArchived === 'true'
        : false,
      ...((task.reminderInterval != updateTaskDto.reminderInterval ||
        task.reminderIntervalNumber !=
          Number(updateTaskDto.reminderIntervalNumber)) && {
        isReminderSent: false,
      }),
      ...(!moment(task.endingDateTime).isSame(
        moment.unix(updateTaskDto.endingDateTime).toDate(),
      ) && {
        isReminderSent: false,
      }),
      // ...((task.repetitionInterval != updateTaskDto.repetitionInterval ||
      //   task.repetitionIntervalNumber !=
      //     updateTaskDto.repetitionIntervalNumber) && {
      //   lastRepeatedAt: `${moment.utc().format('YYYY-MM-DD')} ${moment
      //     .unix(updateTaskDto.endingDateTime)
      //     .format('hh:mm:ss')}`,
      // }),
      ...(updateTaskDto.academicYear && {
        academicYear: academicYear,
      }),
    });

    const tags = updateTaskDto.tags ? JSON.parse(updateTaskDto.tags) : [];
    if (updateTaskDto.tags) {
      await this.taskTagsService.createOrUpdate(tags, workspace, task);
    }

    let uploadedAttachments = null;
    if (attachments && attachments.length) {
      uploadedAttachments =
        await this.taskAttachmentsService.uploadTaskDocuments(
          task,
          attachments,
        );
    }

    // let table =
    //   '<div style="overflow-x: auto;"><table style="table-layout: fixed; width: 100%;border-collapse: collapse;border: 1px solid #ddd;"><thead><tr style="background-color: #ddd;"><td style="border: 1px solid #ddd;">Updates</td><td>Value</td></tr></thead><tbody>';
    let table = '';
    Object.keys(updateTaskDto).map((updateTaskKey, index) => {
      let newKey = updateTaskKey;
      let newValue = updateTaskDto[updateTaskKey];
      if (updateTaskKey === 'assignedToUserUniqueId') {
        newKey = 'User';
        newValue = user?.name ? user?.name : user?.email;
      }
      if (updateTaskKey === 'assignedToTeamUniqueId') {
        newKey = 'Team';
        newValue = team?.teamName;
      }
      if (updateTaskKey === 'startingDateTime') {
        newKey = 'Starting Date';
        newValue = moment
          .unix(updateTaskDto[updateTaskKey])
          .format('DD, MMM YYYY');
      }
      if (updateTaskKey === 'endingDateTime') {
        newKey = 'Ending Date';
        newValue = moment
          .unix(updateTaskDto[updateTaskKey])
          .format('DD, MMM YYYY');
      }
      if (updateTaskKey === 'attachments') {
        newValue = uploadedAttachments?.map(
          (attachment) => attachment.originalname,
        );
      }
      if (updateTaskKey === 'reminderIntervalNumber') {
        newKey = 'Task Reminder Interval';
        newValue = updateTaskDto[updateTaskKey];
      }
      if (updateTaskKey === 'reminderInterval') {
        newKey = 'Task Reminder In';
        newValue = updateTaskDto[updateTaskKey];
      }
      if (updateTaskKey === 'repetitionIntervalNumber') {
        newKey = 'Task Repetition Interval';
        newValue = updateTaskDto[updateTaskKey];
      }
      if (updateTaskKey === 'repetitionInterval') {
        newKey = 'Task Repetition In';
        newValue = updateTaskDto[updateTaskKey];
      }
      if (updateTaskKey === 'academicYear') {
        newKey = 'Academic Year';
        newValue = academicYear.label;
      }
      if (updateTaskKey === 'toBeDoneAtFrom') {
        newKey = 'Task To Be Done At From';
        newValue = moment(updateTaskDto[updateTaskKey], 'HH:mm:ss').format(
          'HH:mm A',
        );
      }
      if (updateTaskKey === 'toBeDoneAtTo') {
        newKey = 'Task To Be Done At To';
        newValue = moment(updateTaskDto[updateTaskKey], 'HH:mm:ss').format(
          'HH:mm A',
        );
      }
      if (updateTaskKey === 'taskName') {
        newKey = 'Task Name';
      }
      if (updateTaskKey === 'taskDescription') {
        newKey = 'Task Description';
      }
      if (updateTaskKey === 'priority') {
        newKey = 'Priority';
      }
      if (updateTaskKey === 'tags') {
        newKey = 'Tags';
        try {
          newValue = JSON.parse(updateTaskDto[updateTaskKey]).join(', ');
        } catch (err) {
          console.log(err);
          newValue = updateTaskDto[updateTaskKey];
        }
      }
      if (updateTaskKey === 'attachments') {
        newKey = 'Attachments';
      }
      if (updateTaskKey === 'progressInPerecentage') {
        newKey = 'Progress';
      }
      if (updateTaskKey === 'status') {
        newKey = 'Status';
      }
      if (updateTaskKey === 'estimatedTimeInSeconds') {
        newKey = 'Estimated Time';
        newValue = updateTaskDto[updateTaskKey]
          ? `${Math.floor(updateTaskDto[updateTaskKey] / 3600).toLocaleString(
              'en-US',
              {
                minimumIntegerDigits: 2,
                useGrouping: false,
              },
            )}h ${Math.floor(
              (updateTaskDto[updateTaskKey] / 3600 -
                Math.floor(updateTaskDto[updateTaskKey] / 3600)) *
                60,
            ).toLocaleString('en-US', {
              minimumIntegerDigits: 2,
              useGrouping: false,
            })}s`
          : '00h 00s';
      }
      if (updateTaskKey !== 'workspaceUniqueId') {
        // table +=
        //   '<tr><td style="border: 1px solid #ddd;">' +
        //   newKey +
        //   '</td><td style="word-wrap: break-word;border: 1px solid #ddd;">' +
        //   newValue +
        //   '</td></tr>';
        table += `<br />${newKey}: <b>${newValue}</b>`;
      }
    });
    // table += '</tbody></table></div>';
    table += '<br />';

    const keys = Object.keys(updateTaskDto);
    if (keys.length > 1)
      await this.taskActivitiesService.create(
        `<b>${authUser.name}</b> has updated a task<br />${table}`,
        activityType.TASK_CREATED,
        task,
        authUser,
      );

    const newTask = await this.getTask(task.taskUniqueId, authUser);

    if (isSendAssignMail) {
      this.sendAssigningOrReminderMail(
        team,
        user,
        newTask,
        SENDGRID_TEMPLATES.TASK_ASSIGNMENT,
      );
    }

    return newTask;
  }

  /**
   * Send assigning mail
   * @param team
   * @param user
   * @param task
   */
  async sendAssigningOrReminderMail(
    team: Team,
    user: Users,
    task: Task,
    template: string,
  ) {
    let teamUsers = [];
    let teamDetails = null;
    if (team) {
      teamDetails = await this.teamsService.getTeamUsers(team.teamUniqueId);
      teamUsers = teamDetails.user.map((u) => u.email);
    }
    console.log(teamDetails);
    const userEmails =
      teamUsers && teamUsers.length > 0 ? teamUsers : [user.email];

    const mail = {
      to: userEmails,
      from: '<nkarkare@taskmgr.in>',
      templateId: template,
      dynamic_template_data: {
        email: userEmails,
        task: {
          ...task,
          taskUrl: `${this.configService.get('FRONTEND_URL')}/tasks?t=${
            task.taskUniqueId
          }`,
          endingDateTime: moment(task.endingDateTime).toString(),
        },
      },
    };

    await this.sendgridService.send(mail);
  }

  /**
   * Get task list
   * @param status
   * @param search
   * @param workspace
   * @param paginationOptions
   * @returns
   */
  async getTaskList(
    status: string,
    search: string,
    workspace: Workspace,
    paginationOptions,
    authUser,
    filterTaskDto: FilterTaskDto,
  ) {
    const { limit, page, offset } = paginationOptions;
    const {
      userIds,
      teamIds,
      tags,
      dueInNextDay,
      dueInNextMonth,
      dueInNextWeek,
      noDates,
      priority,
      overdue,
      academicYear,
      myTasks,
    } = filterTaskDto;

    const userIdsArray = userIds ? userIds.split(',') : [];
    const tagsArray = tags ? tags.split(',') : [];
    const teamIdsArray = teamIds ? teamIds.split(',') : [];
    const overdueFilter = overdue === 'true';
    const dueInNextDayFilter = dueInNextDay === 'true';
    const dueInNextMonthFilter = dueInNextMonth === 'true';
    const dueInNextWeekFilter = dueInNextWeek === 'true';
    const noDatesFilter = noDates === 'true';

    const userUniqueId =
      ![Roles.ADMIN, Roles.SUPERADMIN].includes(authUser.role) &&
      authUser.userUniqueId
        ? authUser.userUniqueId
        : null;

    const userId =
      ![Roles.ADMIN, Roles.SUPERADMIN].includes(authUser.role) && authUser.id
        ? authUser.id
        : null;

    const currentDate = moment.utc().format('YYYY-MM-DD');

    let having = null;
    if (userUniqueId)
      having =
        myTasks === 'true'
          ? `HAVING isShowMyOwnTasks = 1 AND isShowCreatedByMeTasks = 0`
          : `HAVING isShowMyOwnTasks = 1 OR isShowCreatedByMeTasks = 1`;

    const startOfNextMonth = moment()
      .add(1, 'M')
      .startOf('month')
      .format('YYYY-MM-DD hh:mm:ss');

    const endOfNextMonth = moment()
      .add(1, 'M')
      .endOf('month')
      .format('YYYY-MM-DD hh:mm:ss');

    if (having) {
      having = dueInNextMonthFilter
        ? `${having} AND endingDateTime >= '${startOfNextMonth}' AND endingDateTime <= '${endOfNextMonth}'`
        : `${having}`;
    } else {
      having = dueInNextMonthFilter
        ? `HAVING endingDateTime >= '${startOfNextMonth}' AND endingDateTime <= '${endOfNextMonth}'`
        : null;
    }

    // if (having) {
    //   having = dueInNextDayFilter ? `${having} AND dueDays = 1` : `${having}`;
    // } else {
    //   having = dueInNextDayFilter ? `HAVING dueDays = 1` : null;
    // }

    const nextDayDate = moment.utc().add(1, 'days').format('YYYY-MM-DD');

    if (having) {
      having = dueInNextDayFilter
        ? `${having} AND endingDateTime LIKE '${nextDayDate}%'`
        : `${having}`;
    } else {
      having = dueInNextDayFilter
        ? `HAVING endingDateTime  LIKE '${nextDayDate}%'`
        : null;
    }

    const nextWeekStart = moment
      .utc()
      .add(1, 'weeks')
      .startOf('isoWeek')
      .format('YYYY-MM-DD');
    const nextWeekEnd = moment()
      .utc()
      .add(1, 'weeks')
      .endOf('isoWeek')
      .format('YYYY-MM-DD');
    if (having) {
      having = dueInNextWeekFilter
        ? `${having} AND endingDateTime >= '${nextWeekStart}' AND endingDateTime <= '${nextWeekEnd}'`
        : `${having}`;
    } else {
      having = dueInNextWeekFilter
        ? `HAVING  endingDateTime >= '${nextWeekStart}' AND endingDateTime <= '${nextWeekEnd}'`
        : null;
    }

    const tagHavingArrays = tagsArray.map(
      (t) => `FIND_IN_SET('${t.trim()}', tags) > 0 `,
    );
    const tagHavings = tagHavingArrays.join(' OR ');

    if (having) {
      having = tagHavings ? `${having} AND (${tagHavings})` : `${having}`;
    } else {
      having = tagHavings ? `HAVING (${tagHavings})` : null;
    }

    // console.log(moment.utc().format('YYYY-MM-DD HH:mm:ss'));
    const query = `
      SELECT
          t.*,
          au.userUniqueId AS au_userUniqueId,
          au.name AS au_name,
          au.email AS au_email,
          au.id AS au_id,
          at.id AS at_id,
          datediff(t.endingDateTime, '${moment
            .utc()
            .format('YYYY-MM-DD hh:mm:ss')}') as dueDays,
          au.profilePic AS au_profilePic,
          lta.media AS lta_media,
          lta.mediaType AS lta_mediaType,
          lta.seconds AS lta_seconds,
          lta.mediaThumbnail AS lta_mediaThumbnail,
          lta.attachmentUniqueId AS lta_attachmentUniqueId,
          COALESCE(team_users.users, '[]') AS teamUsers,
          IF(t.assignedToUserId, IF(au.userUniqueId = ?, 1, 0), IF(FIND_IN_SET(?, team_users.userUniqueIds) > 0, 1, 0) ) as isShowMyOwnTasks,
          IF(t.createdByUserId, IF(t.createdByUserId = ?, 1, 0), 0) as isShowCreatedByMeTasks,
          (SELECT count(*) as totalAttachments FROM task_attachment ta WHERE ta.taskId = t.id) AS totalAttachments,
          (SELECT count(*) as totalSubtasks FROM task WHERE task.parentId = t.id) AS totalSubtasks,
          (SELECT count(*) as totalSubtasksCompleted FROM task WHERE task.parentId = t.id AND status = ?) AS totalSubtasksCompleted,
          (SELECT count(*) as totalComments FROM task_comment tc WHERE tc.taskId = t.id) AS totalComments,
          (SELECT GROUP_CONCAT(tag SEPARATOR ',') as tags FROM task_tag LEFT join tag on tagId = tag.id where taskId = t.id) AS tags
      FROM
          task t
      LEFT JOIN users au ON
          au.id = t.assignedToUserId AND(au.deletedAt IS NULL)
      LEFT JOIN team at ON
          at.id = t.assignedToTeamId
      LEFT JOIN academic_year acaY ON
          acaY.id = t.academicYearId
      LEFT JOIN (
          SELECT MAX(id) max_id, media, mediaType, mediaThumbnail,seconds,  attachmentUniqueId, taskId
          FROM task_attachment WHERE mediaType = ? 
          GROUP BY taskId
      ) lta  ON lta.taskId = t.id

      LEFT JOIN (
        SELECT  teamId, 
        JSON_ARRAYAGG(json_object('name', t.name, 'userUniqueId', t.userUniqueId, 'profilePic', t.profilePic, 'email', t.email, 'id', t.uId)) AS users,
        GROUP_CONCAT( t.userUniqueId) AS userUniqueIds
        FROM (
            SELECT team_user_mapping.*, users.name, users.email, users.id as uId, users.userUniqueId, users.profilePic 
            FROM team_user_mapping LEFT JOIN users ON users.id = team_user_mapping.userId
            ) t GROUP BY teamId
      ) team_users ON team_users.teamId = t.assignedToTeamId

      WHERE
          t.status = ? AND 
          t.isArchived = ? AND 
          (
              t.taskName LIKE '%${
                search ? search : ''
              }%' OR t.taskDescription LIKE '%${search ? search : ''}%'
          )  
          ${workspace ? `AND t.workspaceId = ${workspace.id}` : ''}
          ${priority ? `AND t.priority = '${priority}'` : ''}
          ${
            overdueFilter
              ? `AND t.endingDateTime <= '${moment.utc().format('YYYY-MM-DD')}'`
              : ''
          }
          ${
            noDatesFilter
              ? `AND t.startingDateTime IS NULL AND t.endingDateTime IS NULL `
              : ''
          }
          ${userIdsArray.length ? `AND t.assignedToUserId IN (${userIds})` : ''}
          ${
            teamIdsArray.length
              ? `AND t.assignedToTeamId IN (${teamIdsArray})`
              : ''
          }
          ${academicYear ? `AND t.academicYearId = ${academicYear}` : ''}
      ${having ? `${having}` : ''}
      ORDER BY
          t.createdAt
      DESC`;

    const array = [
      userUniqueId,
      userUniqueId,
      userId,
      TASK_STATUS.COMPLETED,
      MEDIA_TYPES.IMAGE,
      status,
      0,
    ];

    const queryRunner = this.dataSource.createQueryRunner();

    const data = await queryRunner.manager.query(
      `${query} LIMIT ? OFFSET ?`,
      without([...array, limit, offset], undefined),
    );

    const allData = await queryRunner.manager.query(
      `${query}`,
      without([...array, limit, offset], undefined),
    );

    await queryRunner.release();

    const cards = data.map((t) => {
      return {
        id: Number(t.id),
        taskUniqueId: t.taskUniqueId,
        taskName: t.taskName,
        taskDescription: t.taskDescription,
        priority: t.priority,
        parentId: t.parentId ? Number(t.parentId) : null,
        status: t.status,
        startingDateTime: moment.utc(t.startingDateTime).unix(),
        endingDateTime: moment.utc(t.endingDateTime).unix(),
        estimatedTimeInSeconds: t.estimatedTimeInSeconds,
        progressInPerecentage: t.progressInPerecentage,
        assignedToUser: t.assignedToUserId
          ? {
              userUniqueId: t.au_userUniqueId,
              name: t.au_name,
              profilePic: t.au_profilePic,
              email: t.au_email,
              id: Number(t.au_id),
            }
          : null,
        taskAttachment:
          t.totalAttachments > 0
            ? {
                attachmentUniqueId: t.lta_attachmentUniqueId,
                media: t.lta_media ? castToStorage(t.lta_media) : null,
                mediaType: t.lta_mediaType,
                mediaThumbnail: t.lta_mediaThumbnail,
                seconds: t.lta_seconds,
              }
            : null,
        tags: t.tags ? t.tags.split(',') : [],
        totalAttachments: Number(t.totalAttachments),
        totalComments: Number(t.totalComments),
        assignedToTeam: JSON.parse(t.teamUsers),
        totalSubtasks: Number(t.totalSubtasks),
        totalSubtasksCompleted: Number(t.totalSubtasksCompleted),
      };
    });

    return { cards, total: allData.length ? allData.length : 0 };
  }

  /**
   * Find one by unique id
   * @param taskUniqueId
   * @returns
   */
  async findOneByUniqueId(taskUniqueId: string) {
    return this.taskRepo.findOne({
      where: {
        taskUniqueId: taskUniqueId,
      },
    });
  }

  /**
   * Get Kanban view status list
   * @returns
   */
  async getKanbanStatuses() {
    return [
      {
        id: 1,
        title: TASK_STATUS.ASSIGNED,
        color: '#5051F9',
        bgColor: '#5051F933',
      },
      {
        id: 2,
        title: TASK_STATUS.STARTED,
        color: '#1E99E8',
        bgColor: '#1E99E833',
      },
      {
        id: 3,
        title: TASK_STATUS.COMPLETED,
        color: '#2CC069',
        bgColor: '#2CC06933',
      },
    ];
  }

  /**
   * Remove task
   * @param taskUniqueId
   * @returns
   */
  async remove(taskUniqueId: string) {
    const task = await this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.parent', 'p')
      .where('t.taskUniqueId = :taskUniqueId', { taskUniqueId })
      .getOne();

    if (!task) throw new BadRequestException('Task not found');

    const getSubtasks = await this.taskRepo
      .createQueryBuilder('t')
      .where('parentId = :parentId', { parentId: task.id })
      .getMany();

    if (getSubtasks.length > 0)
      throw new BadRequestException(
        'Please delete all subtasks before proceeding.',
      );

    const taskAttachments = await this.taskAttachmentsService.findAllByTaskId(
      task.id,
    );

    taskAttachments.map((ta) => deleteFile(ta.media));

    await this.taskRepo.remove(task);

    return task;
  }

  /**
   * Import and create users
   * @param csvFile
   * @param importUserDto
   * @returns
   */
  async importAndCreateTasks(authUser, csvFile, importTaskDto: ImportTaskDto) {
    const storeInDatabase = importTaskDto.storeInDatabase
      ? importTaskDto.storeInDatabase
      : 'false';

    const workspace = await this.workspaceService.findOne(
      importTaskDto.workspaceUniqueId,
    );

    if (!workspace) throw new Error('Workspace not exists');

    let createdTasksCount = 0;
    let errorTaskCount = 0;

    const taskIdArrayWithRow = [];

    let errorMessage = '';
    const errors = [];

    if (storeInDatabase === 'false') {
      if (!csvFile) throw new BadRequestException('Please upload xlsx file');

      if (!xlsxFileFilter(csvFile)) {
        throw new BadRequestException('Only xlsx files are allowed!');
      }

      // add csv file extension validation here
      const filename = await uploadFile('task-imports', csvFile);

      const filePath = join(
        __dirname,
        '../../..',
        `public/storage/${filename}`,
      );

      const rows = await readXlsxFile(filePath);

      if (rows.length <= 2) {
        errors.push(`No data was found.`);
        return {
          errorMessage: null,
          error: errors,
          successMessage: null,
        };
      }

      const taskInfos = await Promise.all(
        rows.map(async (wholeRow, key) => {
          if (key === 0 || key === 1) return;
          if (!wholeRow.every((e) => e === null) && wholeRow) {
            // add user record

            const row = classToPlain(wholeRow);

            const tags = row[2];

            const { taskInfo, isValidated, validationErrorMessage } =
              await this.validateTaskInfo(row, workspace.workspaceUniqueId);

            if (!taskInfo) {
              errorTaskCount++;
              errors.push(`Row: ${key + 1}: ${validationErrorMessage} `);
              return;
            } else {
              createdTasksCount = createdTasksCount + 1;
              const parentRowId = taskInfo.parentId ? taskInfo.parentId : null;
              if (parentRowId) {
                return {
                  ...taskInfo,
                  id: key + 1,
                  createdAt: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
                };
              } else {
                return {
                  ...taskInfo,
                  id: key + 1,
                  createdAt: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
                };
              }
            }
          }
        }),
      );

      deleteFile(filename);

      const taskInfoExcelData = taskInfos.filter((task) => task != null);

      const successMessage =
        createdTasksCount > 0
          ? `${createdTasksCount} task(s) will be created.`
          : `No task will be created.`;

      if (errorTaskCount > 0)
        errorMessage = `Error to create ${errorTaskCount} task(s).`;

      return {
        errorMessage: errorMessage ? errorMessage : null,
        errors,
        successMessage: successMessage ? successMessage : null,
        isSuccess: createdTasksCount > 0 ? true : false,
        tasks: taskInfoExcelData,
      };
    }

    const tasks = importTaskDto.tasks ? JSON.parse(importTaskDto.tasks) : [];

    const taskWithoutAssigned = tasks.filter(
      (task) => (task.assignedToUserId || task.assignedToTeamId) && task,
    );

    if (taskWithoutAssigned.length !== tasks.length)
      throw new BadRequestException(
        'Please select user or team for all task(s)',
      );

    const mainTasks = tasks.filter((t) => t.parentId == 0 && t);
    const subTasks = tasks.filter((t) => t.parentId != 0 && t);

    const data = await Promise.all(
      mainTasks.map(async (taskInfo: any) => {
        const taskUniqueId = await generateUniqueId('T');

        const key = taskInfo.id;
        const tags = taskInfo.tags;
        delete taskInfo.id;
        delete taskInfo.tags;

        const user = taskInfo.assignedToUserId
          ? await this.usersService.findOne(taskInfo.assignedToUserId)
          : null;

        delete taskInfo.assignedToUserId;

        const team = taskInfo.assignedToTeamId
          ? await this.teamsService.findOne(taskInfo.assignedToTeamId)
          : null;

        delete taskInfo.assignedToTeamId;

        let task: Task;
        try {
          task = await this.taskRepo.save({
            workspace: { id: workspace.id },
            taskUniqueId,
            ...taskInfo,
            assignedToUser: user,
            assignedToTeam: team,
            ...(authUser.role === Roles.ADMIN && {
              createdByAdmin: { id: authUser.id },
            }),
            ...(![Roles.ADMIN, Roles.SUPERADMIN].includes(authUser.role) && {
              createdByUser: authUser,
            }),
            status: TASK_STATUS.ASSIGNED,
            createdAt: moment.utc(taskInfo.createdAt).toDate(),
            // ...(parentRowId &&
            //   taskRowInfo && {
            //     parentId: taskRowInfo.task,
            //   }),
          });
        } catch (error) {
          // console.log(error);
          throw new BadRequestException(
            'Academic year is compulsory for all tasks',
          );
        }

        if (tags) {
          const tagsArray = Number(tags)
            ? tags.toString().split(',')
            : tags.split(',');
          await this.taskTagsService.createOrUpdate(tagsArray, workspace, task);
        }

        createdTasksCount = createdTasksCount + 1;

        await taskIdArrayWithRow.push({
          row: key,
          task: task,
        });

        await this.taskActivitiesService.create(
          `<b>${authUser.name}</b> has created a task.`,
          activityType.TASK_CREATED,
          task,
          authUser,
        );

        // return this.getTask(task.taskUniqueId);
      }),
    );

    const subTasksInserted = await Promise.all(
      subTasks.map(async (taskInfo) => {
        const key = taskInfo.id;
        const tags = taskInfo.tags;
        delete taskInfo.id;
        delete taskInfo.tags;

        const user = taskInfo.assignedToUserId
          ? await this.usersService.findOne(taskInfo.assignedToUserId)
          : null;

        delete taskInfo.assignedToUserId;

        const team = taskInfo.assignedToTeamId
          ? await this.teamsService.findOne(taskInfo.assignedToTeamId)
          : null;

        delete taskInfo.assignedToTeamId;

        const parentRowId = taskInfo.parentId ? taskInfo.parentId : null;

        const [taskRowInfo] = taskIdArrayWithRow.filter(
          (r) => r.row === parentRowId,
        );

        const parentTask = taskRowInfo?.task;

        const taskUniqueId = await generateUniqueId('T');
        delete taskInfo.id;
        const task: Task = await this.taskRepo.save({
          workspace: { id: workspace.id },
          taskUniqueId,
          ...taskInfo,
          createdAt: moment.utc(taskInfo.createdAt).toDate(),
          assignedToUser: user,
          assignedToTeam: team,
          ...(authUser.role === Roles.ADMIN && {
            createdByAdmin: { id: authUser.id },
          }),
          ...(authUser.role === Roles.SUPERADMIN && {
            createdBySuperAdmin: { id: authUser.id },
          }),
          ...(![Roles.ADMIN, Roles.SUPERADMIN].includes(authUser.role) && {
            createdByUser: authUser,
          }),
          status: TASK_STATUS.ASSIGNED,
          ...(parentTask && {
            parent: { id: parentTask.id },
          }),
        });

        if (tags) {
          const tagsArray = Number(tags)
            ? tags.toString().split(',')
            : tags.split(',');
          await this.taskTagsService.createOrUpdate(tagsArray, workspace, task);
        }

        createdTasksCount = createdTasksCount + 1;

        await taskIdArrayWithRow.push({
          row: key,
          task: { id: task.id },
        });

        await this.taskActivitiesService.create(
          `<b>${authUser.name}</b> has created a subtask <b>${taskInfo.taskName}</b>.`,
          activityType.TASK_CREATED,
          parentTask,
          authUser,
        );

        await this.taskActivitiesService.create(
          `<b>${authUser.name}</b> has created a task.`,
          activityType.TASK_CREATED,
          task,
          authUser,
        );
      }),
    );

    return true;
  }

  /**
   * Import and create users
   * @param csvFile
   * @param importUserDto
   * @returns
   */
  async importAndCreateTasksV2(
    authUser,
    csvFile,
    importTaskDto: ImportTaskDto,
  ) {
    const storeInDatabase = importTaskDto.storeInDatabase
      ? importTaskDto.storeInDatabase
      : 'false';

    const workspace = await this.workspaceService.findOne(
      importTaskDto.workspaceUniqueId,
    );

    if (!workspace) throw new Error('Workspace not exists');

    let createdTasksCount = 0;
    let errorTaskCount = 0;

    const taskIdArrayWithRow = [];

    let errorMessage = '';
    const errors = [];

    if (storeInDatabase === 'false') {
      if (!csvFile) throw new BadRequestException('Please upload xlsx file');

      if (!xlsxFileFilter(csvFile)) {
        throw new BadRequestException('Only xlsx files are allowed!');
      }

      // add csv file extension validation here
      const filename = await uploadFile('task-imports', csvFile);

      const filePath = join(
        __dirname,
        '../../..',
        `public/storage/${filename}`,
      );

      const rows = await readXlsxFile(filePath);

      if (rows.length <= 2) {
        errors.push(`No data was found.`);
        return {
          errorMessage: null,
          error: errors,
          successMessage: null,
        };
      }

      const taskInfos = await Promise.all(
        rows.map(async (wholeRow, key) => {
          if (key === 0 || key === 1) return;
          if (!wholeRow.every((e) => e === null) && wholeRow) {
            // add user record

            const row = classToPlain(wholeRow);

            const tags = row[2];

            const { taskInfo, isValidated, validationErrorMessage } =
              await this.validateTaskInfo(row, workspace.workspaceUniqueId);

            if (!taskInfo) {
              errorTaskCount++;
              errors.push(`Row: ${key + 1}: ${validationErrorMessage} `);
              return;
            } else {
              createdTasksCount = createdTasksCount + 1;
              const parentRowId = taskInfo.parentId ? taskInfo.parentId : null;
              if (parentRowId) {
                return {
                  ...taskInfo,
                  id: key + 1,
                  createdAt: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
                };
              } else {
                return {
                  ...taskInfo,
                  id: key + 1,
                  createdAt: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
                };
              }
            }
          }
        }),
      );

      deleteFile(filename);

      const taskInfoExcelData = taskInfos.filter((task) => task != null);

      const successMessage =
        createdTasksCount > 0
          ? `${createdTasksCount} task(s) will be created.`
          : `No task will be created.`;

      if (errorTaskCount > 0)
        errorMessage = `Error to create ${errorTaskCount} task(s).`;

      return {
        errorMessage: errorMessage ? errorMessage : null,
        errors,
        successMessage: successMessage ? successMessage : null,
        isSuccess: createdTasksCount > 0 ? true : false,
        tasks: taskInfoExcelData,
      };
    }

    const tasks = importTaskDto.tasks ? JSON.parse(importTaskDto.tasks) : [];

    const taskWithoutAssigned = tasks.filter(
      (task) => (task.assignedToUserId || task.assignedToTeamId) && task,
    );

    if (taskWithoutAssigned.length !== tasks.length)
      throw new BadRequestException(
        'Please select user or team for all task(s)',
      );

    const mainTasks = tasks.filter((t) => t.parentId == 0 && t);
    const subTasks = tasks.filter((t) => t.parentId != 0 && t);

    const data = await Promise.all(
      mainTasks.map(async (taskInfo) => {
        const taskUniqueId = await generateUniqueId('T');

        const key = taskInfo.id;
        const tags = taskInfo.tags;
        delete taskInfo.id;
        delete taskInfo.tags;

        let user = taskInfo.assignedToUserId
          ? await this.usersService.findOne(taskInfo.assignedToUserId)
          : await this.usersService.findByUniqueId(
              taskInfo.assignedToUserUniqueId,
            );

        let team = taskInfo.assignedToTeamId
          ? await this.teamsService.findOne(taskInfo.assignedToTeamId)
          : await this.teamsService.findOneByUniqueId(
              taskInfo.assignedToTeamUniqueId,
            );

        if (taskInfo.assignedToUserId) {
          team = null;
        }
        if (taskInfo.assignedToTeamId) {
          user = null;
        }

        delete taskInfo.assignedToTeam;
        delete taskInfo.assignedToUser;
        delete taskInfo.assignedToTeamUniqueId;
        delete taskInfo.assignedToUserUniqueId;
        delete taskInfo.assignedToTeamId;
        delete taskInfo.assignedToUserId;

        let task: Task;
        try {
          task = await this.taskRepo.save({
            workspace: { id: workspace.id },
            taskUniqueId,
            ...taskInfo,
            assignedToUser: user,
            assignedToTeam: team,
            ...(authUser.role === Roles.ADMIN && {
              createdByAdmin: { id: authUser.id },
            }),
            ...(![Roles.ADMIN, Roles.SUPERADMIN].includes(authUser.role) && {
              createdByUser: authUser,
            }),
            status: TASK_STATUS.ASSIGNED,
            createdAt: moment.utc(taskInfo.createdAt).toDate(),
            // ...(parentRowId &&
            //   taskRowInfo && {
            //     parentId: taskRowInfo.task,
            //   }),
            academicYear: { id: taskInfo.academicYear?.academicYearId },
          });
        } catch (error) {
          // console.log(error);
          throw new BadRequestException(
            'Academic year is compulsory for all tasks',
          );
        }

        if (tags) {
          const tagsArray = Number(tags)
            ? tags.toString().split(',')
            : tags.split(',');

          // console.log('tags--', tags);
          await this.taskTagsService.createOrUpdate(tagsArray, workspace, task);
        }

        createdTasksCount = createdTasksCount + 1;

        await taskIdArrayWithRow.push({
          row: key,
          task: task,
        });

        await this.taskActivitiesService.create(
          `<b>${authUser.name}</b> has created a task.`,
          activityType.TASK_CREATED,
          task,
          authUser,
        );

        // return this.getTask(task.taskUniqueId);
      }),
    );

    const subTasksInserted = await Promise.all(
      subTasks.map(async (taskInfo) => {
        const key = taskInfo.id;
        const tags = taskInfo.tags;
        delete taskInfo.id;
        delete taskInfo.tags;

        let user = taskInfo.assignedToUserId
          ? await this.usersService.findOne(taskInfo.assignedToUserId)
          : await this.usersService.findByUniqueId(
              taskInfo.assignedToUserUniqueId,
            );

        let team = taskInfo.assignedToTeamId
          ? await this.teamsService.findOne(taskInfo.assignedToTeamId)
          : await this.teamsService.findOneByUniqueId(
              taskInfo.assignedToTeamUniqueId,
            );

        if (taskInfo.assignedToUserId) {
          team = null;
        }
        if (taskInfo.assignedToTeamId) {
          user = null;
        }

        delete taskInfo.assignedToTeam;
        delete taskInfo.assignedToUser;
        delete taskInfo.assignedToTeamUniqueId;
        delete taskInfo.assignedToUserUniqueId;
        delete taskInfo.assignedToTeamId;
        delete taskInfo.assignedToUserId;

        const parentRowId = taskInfo.parentId ? taskInfo.parentId : null;

        const [taskRowInfo] = taskIdArrayWithRow.filter(
          (r) => r.row === parentRowId,
        );

        const parentTask = taskRowInfo?.task;

        const taskUniqueId = await generateUniqueId('T');
        delete taskInfo.id;

        const task: Task = await this.taskRepo.save({
          workspace: { id: workspace.id },
          taskUniqueId,
          ...taskInfo,
          createdAt: moment.utc(taskInfo.createdAt).toDate(),
          assignedToUser: user,
          assignedToTeam: team,
          ...(authUser.role === Roles.ADMIN && {
            createdByAdmin: { id: authUser.id },
          }),
          ...(authUser.role === Roles.SUPERADMIN && {
            createdBySuperAdmin: { id: authUser.id },
          }),
          ...(![Roles.ADMIN, Roles.SUPERADMIN].includes(authUser.role) && {
            createdByUser: authUser,
          }),
          status: TASK_STATUS.ASSIGNED,
          ...(parentTask && {
            parent: { id: parentTask.id },
          }),
          academicYear: { id: taskInfo.academicYear?.academicYearId },
        });

        if (tags) {
          // console.log(tags);
          // console.log('another', tags.split(/\,/));
          // console.log('split', tags.split(','));

          const tagsArray = Number(tags)
            ? tags.toString().split(',')
            : tags.split(',');
          await this.taskTagsService.createOrUpdate(tagsArray, workspace, task);
        }

        createdTasksCount = createdTasksCount + 1;

        await taskIdArrayWithRow.push({
          row: key,
          task: { id: task.id },
        });

        if (parentTask)
          await this.taskActivitiesService.create(
            `<b>${authUser.name}</b> has created a subtask <b>${taskInfo.taskName}</b>.`,
            activityType.TASK_CREATED,
            parentTask,
            authUser,
          );

        if (task)
          await this.taskActivitiesService.create(
            `<b>${authUser.name}</b> has created a task.`,
            activityType.TASK_CREATED,
            task,
            authUser,
          );
      }),
    );

    return true;
  }

  /**
   * Validate excel task info
   * @param taskInfo
   * @returns
   */
  async validateTaskInfo(taskInfo, workspaceUniqueId) {
    const taskName = taskInfo[0];

    const taskDescription = taskInfo[1];
    const tags = taskInfo[2];
    const startDate = taskInfo[3];
    const dueDate = taskInfo[4];
    const assignedToTeamUniqueId = taskInfo[5];
    const assignedToUserUniqueId = taskInfo[6];
    const academicYearUniqueId = taskInfo[7];
    const estimatedTimeInSeconds = taskInfo[8] * 3600;
    const priority = taskInfo[9];
    const repetitionIntervalNumber = taskInfo[10];
    const repetitionInterval = taskInfo[11];
    const reminderIntervalNumber = taskInfo[12];
    const reminderInterval = taskInfo[13];
    const toBeDoneAtFrom = taskInfo[14];
    const toBeDoneAtTo = taskInfo[15];
    const parentId = taskInfo[16];

    if (!taskName || !taskDescription)
      return {
        isValidated: false,
        validationErrorMessage: 'Task name or Description missing',
      };

    if (
      estimatedTimeInSeconds &&
      (!Number.isInteger(estimatedTimeInSeconds) ||
        Number(estimatedTimeInSeconds) <= 0)
    )
      return {
        isValidated: false,
        validationErrorMessage: 'Invalid estimated time',
      };

    if (
      reminderIntervalNumber &&
      (!Number.isInteger(reminderIntervalNumber) ||
        Number(reminderIntervalNumber) <= 0)
    )
      return {
        isValidated: false,
        validationErrorMessage: 'Invalid reminder interval number',
      };

    if (
      repetitionIntervalNumber &&
      (!Number.isInteger(repetitionIntervalNumber) ||
        Number(repetitionIntervalNumber) <= 0)
    )
      return {
        isValidated: false,
        validationErrorMessage: 'Invalid repetition interval number',
      };

    if (
      ![
        TASK_PRIORITY.HIGH,
        TASK_PRIORITY.LOW,
        TASK_PRIORITY.NORMAL,
        TASK_PRIORITY.URGENT,
      ].includes(priority)
    )
      return { isValidated: false, validationErrorMessage: 'Invalid priority' };

    if (
      reminderIntervalNumber &&
      ![
        INTERVALS.DAILY,
        INTERVALS.MONTHLY,
        INTERVALS.ONGOING,
        INTERVALS.QUARTERLY,
        INTERVALS.WEEKLY,
        INTERVALS.YEARLY,
      ].includes(reminderInterval)
    )
      return {
        isValidated: false,
        validationErrorMessage: 'Invalid reminder interval',
      };

    if (!(startDate instanceof Date))
      return {
        isValidated: false,
        validationErrorMessage: 'Invalid Start date',
      };

    if (!(dueDate instanceof Date))
      return { isValidated: false, validationErrorMessage: 'Invalid Due date' };

    if (moment(startDate).isAfter(dueDate))
      return {
        isValidated: false,
        validationErrorMessage: 'Invalid Start or Due date',
      };

    if (moment(startDate).isBefore(moment().format('YYYY-MM-DD')))
      return {
        isValidated: false,
        validationErrorMessage: 'Invalid Start or Due date',
      };

    if (
      repetitionIntervalNumber &&
      ![
        INTERVALS.DAILY,
        INTERVALS.MONTHLY,
        INTERVALS.ONGOING,
        INTERVALS.QUARTERLY,
        INTERVALS.WEEKLY,
        INTERVALS.YEARLY,
      ].includes(repetitionInterval)
    )
      return {
        isValidated: false,
        validationErrorMessage: 'Invalid repetition interval',
      };

    if (parentId) {
      if (!Number.isInteger(parentId) || Number(parentId) <= 0)
        return {
          isValidated: false,
          validationErrorMessage: 'Invalid parentId',
        };
    }

    if (toBeDoneAtFrom && !moment(toBeDoneAtFrom).isValid())
      return {
        isValidated: false,
        validationErrorMessage: 'Invalid to be done at from',
      };

    if (toBeDoneAtTo && !moment(toBeDoneAtTo).isValid())
      return {
        isValidated: false,
        validationErrorMessage: 'Invalid to be done at to',
      };

    if (!assignedToTeamUniqueId && !assignedToUserUniqueId) {
      return {
        isValidated: false,
        validationErrorMessage:
          'One field is required: assignedToTeamUniqueId or AssignedToUserUniqueId',
      };
    }

    let team: any;
    if (assignedToTeamUniqueId) {
      if (assignedToUserUniqueId) {
        return {
          isValidated: false,
          validationErrorMessage:
            'Only one field required: assignedToTeamUniqueId or AssignedToUserUniqueId',
        };
      }

      team = await this.teamsService.findOneByUniqueIdAndWorkspace(
        assignedToTeamUniqueId,
        workspaceUniqueId,
      );

      if (!team) {
        return {
          isValidated: false,
          validationErrorMessage: 'AssignedToTeam not found',
        };
      }
    }

    let user: any;
    if (assignedToUserUniqueId) {
      if (assignedToTeamUniqueId) {
        return {
          isValidated: false,
          validationErrorMessage:
            'Only one field required: assignedToTeamUniqueId or AssignedToUserUniqueId',
        };
      }

      user = await this.usersService.findByUniqueIdAndWorkspace(
        assignedToUserUniqueId,
        workspaceUniqueId,
      );

      if (!user) {
        return {
          isValidated: false,
          validationErrorMessage: 'AssignedToUser not found',
        };
      }
    }

    if (!academicYearUniqueId) {
      return {
        isValidated: false,
        validationErrorMessage: 'academicYearUniqueId is required',
      };
    }

    const academicYear = await this.academicYearsService.findOneByWorkspace(
      academicYearUniqueId,
      workspaceUniqueId,
    );

    if (!academicYear) {
      return {
        isValidated: false,
        validationErrorMessage: 'academicYearUniqueId is not valid',
      };
    }

    return {
      isValidated: true,
      taskInfo: {
        taskName,
        taskDescription,
        startDate,
        estimatedTimeInSeconds: Number(estimatedTimeInSeconds),
        priority,
        reminderIntervalNumber: reminderIntervalNumber
          ? Number(reminderIntervalNumber)
          : null,
        reminderInterval: reminderIntervalNumber ? reminderInterval : null,
        repetitionIntervalNumber: reminderIntervalNumber
          ? Number(reminderIntervalNumber)
          : null,
        toBeDoneAtFrom: toBeDoneAtFrom
          ? moment(toBeDoneAtFrom).format('HH:mm:ss')
          : null,
        toBeDoneAtTo: toBeDoneAtTo
          ? moment(toBeDoneAtTo).format('HH:mm:ss')
          : null,
        repetitionInterval: repetitionIntervalNumber
          ? repetitionInterval
          : null,
        ...(startDate && {
          startingDateTime: moment(startDate).format('YYYY-MM-DD'),
        }),
        ...(dueDate && {
          endingDateTime: moment(dueDate).format('YYYY-MM-DD'),
        }),
        parentId: Number(parentId),
        tags,
        assignedToUserUniqueId,
        assignedToTeamUniqueId,
        academicYear,
        assignedToTeam: team,
        assignedToUser: user,
      },
    };
  }

  /**
   * Cron job
   */
  @Cron('0 0 * * *')
  async handleReminderCron() {
    const queryRunner = this.dataSource.createQueryRunner();

    const now = moment.utc().format('YYYY-MM-DD hh:mm:ss');

    const q = `SELECT 
        task.*, 
        DATEDIFF(endingDateTime, CURDATE())/7 as diffInWeek,
        COALESCE(team_users.users, '[]') AS teamUsers,
        users.email AS email,
        IF(
          IF(reminderInterval = '${INTERVALS.WEEKLY}', FLOOR(DATEDIFF(endingDateTime, '${now}')/7), 0) = reminderIntervalNumber,
            1,
            0
        ) AS isSendWeeklyEmail,
        IF(
          IF(reminderInterval = '${INTERVALS.DAILY}', FLOOR(DATEDIFF(endingDateTime, '${now}')), 0) = reminderIntervalNumber,
            1,
            0
        ) AS isSendDailyEmail,
        IF(
          IF(reminderInterval = '${INTERVALS.MONTHLY}', ROUND(TIMESTAMPDIFF(DAY, '${now}', endingDateTime)*12/365.24), 0) = reminderIntervalNumber,
            1,
            0
        ) AS isSendMonthlyEmail,
        IF(
          IF(reminderInterval = '${INTERVALS.QUARTERLY}', ROUND(TIMESTAMPDIFF(DAY, '${now}', endingDateTime)*12/(3*365.24)), 0) = reminderIntervalNumber,
            1,
            0
        ) AS isSendQuarterlyEmail,
        IF(
          IF(reminderInterval = '${INTERVALS.YEARLY}', TIMESTAMPDIFF(YEAR, '${now}', endingDateTime), 0) = reminderIntervalNumber,
            1,
            0
        ) AS isSendYearlyEmail
      FROM 
        task 
      LEFT JOIN (
        SELECT  teamId, 
        JSON_ARRAYAGG(t.email) AS users,
        GROUP_CONCAT( t.userUniqueId) AS userUniqueIds
        FROM (
            SELECT team_user_mapping.*, users.name, users.email, users.id as uId, users.userUniqueId, users.profilePic 
            FROM team_user_mapping LEFT JOIN users ON users.id = team_user_mapping.userId
            ) t GROUP BY teamId
      ) team_users ON team_users.teamId = task.assignedToTeamId
      LEFT JOIN users ON users.id = task.assignedToUserId
      WHERE
        reminderIntervalNumber IS NOT NULL AND 
        reminderInterval IS NOT NULL AND
        isReminderSent = 0 AND
        isArchived = 0 AND status != '${TASK_STATUS.COMPLETED}'
      HAVING 
        isSendWeeklyEmail = 1 OR 
        isSendDailyEmail = 1 OR 
        isSendMonthlyEmail = 1  OR 
        isSendYearlyEmail = 1 OR
        isSendQuarterlyEmail = 1
      ORDER BY task.id DESC`;

    console.log('query ----', q);
    const tasks = await queryRunner.manager.query(
      `${q}`,
      without([], undefined),
    );

    await queryRunner.release();
    console.log('tasks', tasks);

    tasks.map(async (t) => {
      console.log('sending for ', t);
      console.log('sending for ', t.taskName);
      const teamUsers = JSON.parse(t.teamUsers);

      const userEmails =
        teamUsers && teamUsers.length > 0 ? teamUsers : [t.email];

      // console.log(userEmails);
      // await this.mailerService.sendMail({
      //   to: userEmails,
      //   subject: `It's Time to Get Your Task Together!`,
      //   template: 'task-reminder',
      //   context: {
      //     email: userEmails,
      //     task: t,
      //   },
      // });
      const mail = {
        to: userEmails,
        from: '<nkarkare@taskmgr.in>',
        templateId: SENDGRID_TEMPLATES.TASK_REMINDER,
        dynamic_template_data: {
          email: userEmails,
          task: {
            ...t,
            taskUrl: `${this.configService.get('FRONTEND_URL')}/tasks?t=${
              t.taskUniqueId
            }`,
            endingDateTime: moment(t.endingDateTime).toString(),
          },
        },
      };

      this.sendgridService.send(mail);
    });

    const taskIds = tasks.map((t) => t.id);

    await this.taskRepo.update(
      {
        id: In(taskIds),
      },
      { isReminderSent: true },
    );
  }

  // @Cron('*/5 * * * *')
  @Cron('0 0 * * *')
  async handleTaskRepeatitionCron() {
    // console.log('Repetition task cron');

    const repetitionTasks = await this.taskRepo.find({
      where: {
        repetitionIntervalNumber: Not(IsNull()),
        repetitionInterval: Not(IsNull()),
        isRepeat: false,
      },
      relations: [
        'createdByAdmin',
        'createdBySuperAdmin',
        'createdByUser',
        'parent',
      ],
    });

    await Promise.all(
      repetitionTasks.map(async (task) => {
        await this.repeatTask(task, false);

        await this.taskRepo.update(task.id, {
          isRepeat: true,
        });
      }),
    );

    const tasks = await this.taskRepo.find({
      where: {
        repetitionIntervalNumber: Not(IsNull()),
        repetitionInterval: Not(IsNull()),
        isRepeat: true,
        isRepeated: false,
      },
      relations: [
        'createdByAdmin',
        'createdBySuperAdmin',
        'createdByUser',
        'parent',
      ],
    });

    await Promise.all(
      tasks.map(async (task) => {
        let triggerDuplicate = false;
        if (task.repetitionInterval === INTERVALS.DAILY) {
          if (
            moment(task.endingDateTime)
              .add(task.repetitionIntervalNumber, 'days')
              .format('DD-MM-YYYY') === moment().format('DD-MM-YYYY')
          ) {
            triggerDuplicate = true;
          }
        }
        if (task.repetitionInterval === INTERVALS.WEEKLY) {
          if (
            moment(task.endingDateTime)
              .add(task.repetitionIntervalNumber, 'weeks')
              .format('DD-MM-YYYY') === moment().format('DD-MM-YYYY')
          ) {
            triggerDuplicate = true;
          }
        }
        if (task.repetitionInterval === INTERVALS.MONTHLY) {
          if (
            moment(task.endingDateTime)
              .add(task.repetitionIntervalNumber, 'months')
              .format('DD-MM-YYYY') === moment().format('DD-MM-YYYY')
          ) {
            triggerDuplicate = true;
          }
        }
        if (task.repetitionInterval === INTERVALS.QUARTERLY) {
          if (
            moment(task.endingDateTime)
              .add(task.repetitionIntervalNumber * 3, 'months')
              .format('DD-MM-YYYY') === moment().format('DD-MM-YYYY')
          ) {
            triggerDuplicate = true;
          }
        }
        if (task.repetitionInterval === INTERVALS.YEARLY) {
          if (
            moment(task.endingDateTime)
              .add(task.repetitionIntervalNumber, 'years')
              .format('DD-MM-YYYY') === moment().format('DD-MM-YYYY')
          ) {
            triggerDuplicate = true;
          }
        }

        if (triggerDuplicate) {
          await this.repeatTask(task, true);

          // console.log('Task repetition done: ', task.taskName);
        }
      }),
    );
    // console.log('Repetition task cron end');
  }

  /**
   * Create zip file for database backup
   * @param fileName
   */
  async createzip(fileName) {
    const output = fs.createWriteStream(`./databasebackup/${fileName}.zip`);
    const archive = archiver('zip', {
      gzip: true,
      zlib: { level: 9 }, // Sets the compression level.
    });

    await archive.pipe(output); // pipe archive data to the output file

    // append files
    archive.file(`./databasebackup/${fileName}`, {
      name: fileName,
    });

    await archive.finalize();
  }

  /**
   * DATABASE BACKUP EVERY TWO HOURS
   * THIS WILL DELETE Files (TEST FOR EVERY 15 SECONDS - 0/15 * * * * *)
   */
  @Cron('0 */2 * * *')
  async handleDatabaseBackup() {
    const fileName = `taskmgr_${moment().format('YYYY-MM-DD_HH:mm')}.sql`;

    const dir = './databasebackup';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    await mysqldump({
      connection: {
        host: `${process.env.DB_HOST}`,
        user: `${process.env.DB_USERNAME}`,
        password: `${process.env.DB_PASSWORD}`,
        database: `${process.env.DB_DATABASE}`,
      },
      dumpToFile: `${join(__dirname, `../../../databasebackup/${fileName}`)}`,
    });

    await this.createzip(fileName);

    // unlink sql file
    fs.unlinkSync(join(__dirname, `../../../databasebackup/${fileName}`));

    fs.readdirSync(join(__dirname, `../../../databasebackup/`)).forEach(
      (file) => {
        const fileCreatedAt = moment(
          fs.statSync(join(__dirname, `../../../databasebackup/${file}`)).ctime,
        ).unix();

        const isOlder = fileCreatedAt < moment().unix() - 129600; // Remove files older than 1.5 day = 1.5 * 24 * 60 * 60

        if (isOlder)
          fs.unlinkSync(join(__dirname, `../../../databasebackup/${file}`));
      },
    );
  }

  /**
   * export Tasks
   * @param workspaceUniqueId
   * @returns
   */
  async exportTasksDetails(workspaceUniqueId: string): Promise<any> {
    const tasks = await this.taskRepo.find({
      where: {
        workspace: { workspaceUniqueId: workspaceUniqueId },
      },
    });

    if (!tasks || tasks.length <= 0) {
      throw new BadRequestException('No tasks found');
    }

    return await createXlsxFile(
      tasks,
      `tasks_${workspaceUniqueId}`,
      EXPORT_FILENAME.TASK_MODULE,
    );
  }

  async notifyTask(taskUniqueId: string) {
    const task = await this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.assignedToTeam', 'at')
      .leftJoinAndSelect('t.assignedToUser', 'u')
      .where('t.taskUniqueId = :taskUniqueId', { taskUniqueId })
      .getOne();

    if (!task) throw new BadRequestException('Task not found');

    if (task.status === TASK_STATUS.COMPLETED)
      throw new BadRequestException('Task is completed ');

    this.sendAssigningOrReminderMail(
      task.assignedToTeam,
      task.assignedToUser,
      task,
      SENDGRID_TEMPLATES.TASK_REMINDER,
    );
  }

  /**
   * upcoming task listing reports
   * @param authUser
   * @param _page
   * @param _limit
   * @param search
   * @param workspaceUniqueId
   * @returns
   */
  async upcomingTaskReports(
    authUser,
    paginationOptions: IPaginationOptions,
    search: string,
    workspaceUniqueId: string,
    startDate: string,
    endDate: string,
  ) {
    const { limit, page } = paginationOptions;
    const offset = Number(page) * Number(limit) - Number(limit);

    const upcomingTasksData: any = this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.parent', 'p')
      .leftJoinAndSelect('t.assignedToTeam', 'at')
      .leftJoin('t.workspace', 'w')
      .leftJoin('t.assignedToUser', 'u')
      .leftJoin('t.assignedToTeam', 'att')
      .leftJoin('t.academicYear', 'academicY')
      .addSelect([
        'u.id',
        'u.userUniqueId',
        'u.email',
        'u.name',
        'u.profilePic',
      ])
      .loadRelationCountAndMap('t.totalSubtasks', 't.totalSubtasks')
      .addSelect(['w.id', 'w.workspaceUniqueId', 'w.workspaceName'])
      .addSelect(['att.id', 'att.teamUniqueId', 'att.teamName'])
      .loadRelationCountAndMap('t.totalAttachments', 't.totalAttachments')
      .addSelect([
        'academicY.id',
        'academicY.label',
        'academicY.from',
        'academicY.to',
        'academicY.createdAt',
        'academicY.isDefault',
      ])
      .where('w.workspaceUniqueId = :workspaceUniqueId', {
        workspaceUniqueId: workspaceUniqueId,
      })
      .andWhere('CAST(t.startingDateTime as Date) >= :startingDateTime', {
        startingDateTime: moment().format('YYYY-MM-DD'),
      })
      .andWhere('t.isArchived = :isArchived', {
        isArchived: false,
      });

    if (startDate && startDate !== 'Invalid Date') {
      upcomingTasksData.andWhere('t.endingDateTime >= :startDate', {
        startDate: moment(startDate, 'YYYY-MM-DD').startOf('day').toDate(),
      });
    }

    if (endDate && endDate !== 'Invalid Date') {
      upcomingTasksData.andWhere('t.endingDateTime <= :endDate', {
        endDate: moment(endDate, 'YYYY-MM-DD').endOf('day').toDate(),
      });
    }

    if (search && search !== '') {
      upcomingTasksData.andWhere(
        't.taskName COLLATE Latin1_General_CS_AS LIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }

    const upcomingTasks = await upcomingTasksData
      .orderBy('t.endingDateTime', 'DESC')
      .skip(offset)
      .take(Number(limit))
      .getMany();

    const tasks: any = Array.from(
      { length: upcomingTasks.length },
      (_, index) => ({
        ...upcomingTasks[index],
        subTask: [],
      }),
    );

    await Promise.all(
      tasks.map(async (task: any, index: number) => {
        let teamUsers = [];
        if (task.assignedToTeam) {
          teamUsers = await this.teamUserMappingService.getAllUsersByTeamId(
            task.assignedToTeam.id,
          );
        }
        Object.assign(task, {
          teamUsers: teamUsers,
        });

        if (task.parent) {
          tasks
            .filter((item: any) => item.id === task.parent.id)[0]
            ?.subTask.push(task),
            delete tasks[index];
        }
        delete task['parent'];
        return null;
      }),
    );

    const filteredTasks = tasks.filter((n) => n);

    // const sortedTasks = filteredTasks.sort((a, b) =>
    //   moment(a.endingDateTime).diff(moment(b.endingDateTime)),
    // );

    const total = this.taskRepo
      .createQueryBuilder('t')
      .leftJoin('t.workspace', 'w')
      .leftJoinAndSelect('t.parent', 'p')
      .addSelect(['w.id', 'w.workspaceUniqueId', 'w.workspaceName'])
      .where('w.workspaceUniqueId = :workspaceUniqueId', {
        workspaceUniqueId: workspaceUniqueId,
      })
      .andWhere('t.startingDateTime >= :startingDateTime', {
        startingDateTime: moment().startOf('day').format('YYYY-MM-DD hh:mm:ss'),
      })
      .andWhere('t.isArchived = :isArchived', {
        isArchived: false,
      })
      .andWhere('p.id is :parentId', {
        parentId: null,
      });

    if (startDate && startDate !== 'Invalid Date') {
      total.andWhere('t.endingDateTime >= :startDate', {
        startDate: moment(startDate, 'YYYY-MM-DD').startOf('day').toDate(),
      });
    }

    if (endDate && endDate !== 'Invalid Date') {
      total.andWhere('t.endingDateTime <= :endDate', {
        endDate: moment(endDate, 'YYYY-MM-DD').endOf('day').toDate(),
      });
    }

    if (search && search !== '') {
      total.andWhere('t.taskName COLLATE Latin1_General_CS_AS LIKE :search', {
        search: `%${search}%`,
      });
    }
    const totalData = await total.getMany();

    const totalTasks: any = Array.from(
      { length: totalData.length },
      (_, index) => ({
        ...totalData[index],
        subTask: [],
      }),
    );

    await Promise.all(
      totalTasks.map(async (task: any, index: number) => {
        let teamUsers = [];
        if (task.assignedToTeam) {
          teamUsers = await this.teamUserMappingService.getAllUsersByTeamId(
            task.assignedToTeam.id,
          );
        }
        Object.assign(task, {
          teamUsers: teamUsers,
        });

        if (task.parent) {
          totalTasks
            .filter((item: any) => item.id === task.parent.id)[0]
            ?.subTask.push(task),
            delete task[index];
        }
        delete totalTasks['parent'];
        return null;
      }),
    );

    const filteredTotalTasks = totalTasks.filter((n) => n);
    return [filteredTasks, filteredTotalTasks];
  }

  /**
   * all task listing reports
   * @param authUser
   * @param _page
   * @param _limit
   * @param search
   * @param workspaceUniqueId
   * @returns
   */
  async allTaskReports(
    authUser,
    paginationOptions: IPaginationOptions,
    search: string,
    workspaceUniqueId: string,
  ) {
    const { limit, page } = paginationOptions;
    const offset = Number(page) * Number(limit) - Number(limit);

    const allTaskData: any = this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.parent', 'p')
      .leftJoinAndSelect('t.assignedToTeam', 'at')
      .leftJoin('t.workspace', 'w')
      .leftJoin('t.assignedToUser', 'u')
      .leftJoin('t.assignedToTeam', 'att')
      .leftJoin('t.academicYear', 'academicY')
      .addSelect([
        'u.id',
        'u.userUniqueId',
        'u.email',
        'u.name',
        'u.profilePic',
      ])
      .loadRelationCountAndMap('t.totalSubtasks', 't.totalSubtasks')
      .addSelect(['w.id', 'w.workspaceUniqueId', 'w.workspaceName'])
      .addSelect(['att.id', 'att.teamUniqueId', 'att.teamName'])
      .loadRelationCountAndMap('t.totalAttachments', 't.totalAttachments')
      .addSelect([
        'academicY.id',
        'academicY.label',
        'academicY.from',
        'academicY.to',
        'academicY.createdAt',
        'academicY.isDefault',
      ])
      .where('w.workspaceUniqueId = :workspaceUniqueId', {
        workspaceUniqueId: workspaceUniqueId,
      })
      .andWhere('t.isArchived = :isArchived', {
        isArchived: false,
      });

    if (search && search !== '') {
      allTaskData.andWhere(
        't.taskName COLLATE Latin1_General_CS_AS LIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }

    const allTasks = await allTaskData
      .orderBy('t.startingDateTime', 'DESC')
      .skip(offset)
      .take(Number(limit))
      .getMany();

    const tasks: any = Array.from({ length: allTasks.length }, (_, index) => ({
      ...allTasks[index],
      subTask: [],
    }));

    await Promise.all(
      tasks.map(async (task: any, index: number) => {
        let teamUsers = [];
        if (task.assignedToTeam) {
          teamUsers = await this.teamUserMappingService.getAllUsersByTeamId(
            task.assignedToTeam.id,
          );
        }
        Object.assign(task, {
          teamUsers: teamUsers,
        });

        if (task.parent) {
          tasks
            .filter((item: any) => item.id === task.parent.id)[0]
            ?.subTask.push(task),
            delete tasks[index];
        }
        delete task['parent'];
        return null;
      }),
    );

    const filteredTasks = tasks.filter((n) => n);

    // const sortedTasks = filteredTasks.sort((a, b) =>
    //   moment(a.endingDateTime).diff(moment(b.endingDateTime)),
    // );

    const total = this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.parent', 'p')
      .leftJoin('t.workspace', 'w')
      .where('w.workspaceUniqueId = :workspaceUniqueId', {
        workspaceUniqueId: workspaceUniqueId,
      })
      .andWhere('t.isArchived = :isArchived', {
        isArchived: false,
      });

    if (search && search !== '') {
      total.andWhere('t.taskName COLLATE Latin1_General_CS_AS LIKE :search', {
        search: `%${search}%`,
      });
    }

    const totalData = await total.getMany();

    const totalTasks: any = Array.from(
      { length: totalData.length },
      (_, index) => ({
        ...totalData[index],
        subTask: [],
      }),
    );

    await Promise.all(
      totalTasks.map(async (task: any, index: number) => {
        let teamUsers = [];
        if (task.assignedToTeam) {
          teamUsers = await this.teamUserMappingService.getAllUsersByTeamId(
            task.assignedToTeam.id,
          );
        }
        Object.assign(task, {
          teamUsers: teamUsers,
        });

        if (task.parent) {
          totalTasks
            .filter((item: any) => item.id === task.parent.id)[0]
            ?.subTask.push(task),
            delete totalTasks[index];
        }
        delete task['parent'];
        return null;
      }),
    );

    const filteredTotalTasks = totalTasks.filter((n) => n);

    return [filteredTasks, filteredTotalTasks];
  }

  // async isTaskValid(authUser, workspaceUniqueId: string, taskUniqueId: string) {
  //   console.log(authUser.role, Roles.SUPERADMIN);
  //   const task = await this.taskRepo.findOne({
  //     where: {
  //       taskUniqueId: taskUniqueId,
  //       workspace: { workspaceUniqueId: workspaceUniqueId },
  //       ...(authUser.role === Roles.ADMIN && {
  //         createdByAdmin: { id: authUser.id },
  //       }),
  //       ...(authUser.role === Roles.SUPERADMIN && {
  //         createdBySuperAdmin: { id: authUser.id },
  //       }),
  //       ...(![Roles.ADMIN, Roles.SUPERADMIN].includes(authUser.role) && {
  //         createdByUser: authUser,
  //       }),
  //     },
  //   });

  //   if (task) {
  //     return {
  //       isTaskValid: true,
  //     };
  //   } else {
  //     return {
  //       isTaskValid: false,
  //     };
  //   }
  // }
}
