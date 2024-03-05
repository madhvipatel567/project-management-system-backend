import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles } from 'src/common/decorators/permissions.decorator';
import { generateUniqueId } from 'src/common/helper/common.helper';
import { Brackets, Not, Repository } from 'typeorm';
import { Admin } from '../admin/entities/admin.entity';
import { Task, TASK_STATUS } from '../tasks/entities/task.entity';
import { TasksService } from '../tasks/tasks.service';
import { TeamHierarchyService } from '../team-hierarchy/team-hierarchy.service';
import { TeamUserMapping } from '../team-user-mappings/entities/team-user-mapping.entity';
import { TeamUserMappingService } from '../team-user-mappings/team-user-mapping.service';
import { Users } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Team } from './entities/team.entity';
import { createXlsxFile } from 'src/common/helper/fileupload.helper';
import { EXPORT_FILENAME } from 'src/common/constants';
import * as moment from 'moment';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,

    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    private teamUserMappingService: TeamUserMappingService,
    private usersService: UsersService,

    private teamHierarchyService: TeamHierarchyService,

    @Inject(forwardRef(() => TasksService))
    private tasksService: TasksService,
  ) {}

  /**
   * Create team
   * @param authUser
   * @param createTeamDto
   * @returns
   */
  async createTeam(authUser, createTeamDto: CreateTeamDto) {
    const workspace = await this.workspaceRepository.findOne({
      where: {
        workspaceUniqueId: createTeamDto.workspaceUniqueId,
      },
    });

    if (!workspace) throw new BadRequestException('Workspace not found!');

    if (!createTeamDto.isDuplicate) {
      const team = await this.teamRepository.findOne({
        where: {
          teamName: createTeamDto.teamName.trim(),
          workspace: { id: workspace.id },
        },
      });

      if (team) {
        throw new BadRequestException('Team with this name already exists');
      }
    } else {
      const generatedTeamName = await this.generateTeamNameDuplication(
        createTeamDto.teamName,
        workspace,
      );

      if (generatedTeamName) createTeamDto.teamName = generatedTeamName;
    }

    const teamUniqueId = await generateUniqueId('T');

    const newTeam = await this.teamRepository.save(
      this.teamRepository.create({
        ...createTeamDto,
        teamUniqueId,
        ...(authUser.role === Roles.ADMIN && {
          admin: { id: authUser.id },
        }),
        ...(![Roles.ADMIN, Roles.SUPERADMIN].includes(authUser.role) && {
          user: { id: authUser.id },
        }),
        workspace: workspace,
      }),
    );

    if (createTeamDto.userUniqueId) {
      await Promise.all(
        createTeamDto.userUniqueId.map(async (userUniqueId) => {
          const user = await this.usersService.findByUniqueId(userUniqueId);

          if (user) await this.teamUserMappingService.create(newTeam, user);
        }),
      );
    }

    if (
      createTeamDto.teamIdsForHierarchy &&
      createTeamDto.teamIdsForHierarchy.length > 0
    ) {
      const teamsForHierarchy = await this.findIn(
        createTeamDto.teamIdsForHierarchy,
      );

      const ids = teamsForHierarchy.map((t) => t.id);

      // const ids = await Promise.all(
      //   teamsForHierarchy.map(async (t) => {
      //     const teamHierarchy = await this.teamHierarchyService.findAllByTeamId(
      //       t.id,
      //     );

      //     if (teamHierarchy.length > 0) {
      //       const ids = teamHierarchy.map((t) => t.team?.teamUniqueId);

      //       const teams = await this.findIn(ids);

      //       teams?.map((team) => {
      //         if (team.id === newTeam.id) {
      //           throw new BadRequestException(
      //             `Team "${team.teamName}" can't be part of collection of this team`,
      //           );
      //         }
      //       });
      //     }
      //     return t.id;
      //   }),
      // );

      await this.teamHierarchyService.create(ids, newTeam);
    }
  }

  /**
   * Generate name for duplication
   * @param teamName
   * @param workspace
   * @returns
   */
  async generateTeamNameDuplication(teamName: string, workspace: Workspace) {
    let generatedTeamName = null;
    const teamDuplicates = await this.teamRepository
      .createQueryBuilder('t')
      .where('teamName = :teamName', {
        teamName: teamName.trim(),
      })
      .andWhere('workspaceId =:workspaceId', { workspaceId: workspace.id })
      .getMany();

    if (teamDuplicates.length) {
      const lastTeamDuplications = await this.teamRepository
        .createQueryBuilder('t')
        .where(`teamName LIKE '${teamName.trim()}%'`)
        .andWhere('workspaceId =:workspaceId', { workspaceId: workspace.id })
        .orderBy('t.createdAt', 'DESC')
        .getMany();

      const teamNameNumbers = lastTeamDuplications.map((t) =>
        isNaN(Number(t.teamName.replace(teamName.trim(), '')))
          ? 0
          : Number(t.teamName.replace(teamName.trim(), '')),
      );

      const largest = teamNameNumbers.length
        ? Math.max.apply(0, teamNameNumbers)
        : 1;

      // console.log(teamNameNumbers);

      if (lastTeamDuplications.length) {
        generatedTeamName = `${teamName} ${largest + 1}`;
      }
    }
    return generatedTeamName;
  }

  /**
   * Update team
   * @param teamUniqueId
   * @param authAdmin
   * @param updateTeamDto
   */
  async updateTeam(
    teamUniqueId: string,
    authAdmin: Admin,
    updateTeamDto: UpdateTeamDto,
  ) {
    const teamExists = await this.findOneByUniqueId(teamUniqueId);

    if (!teamExists) throw new BadRequestException('Team not exists');

    const workspace = await this.workspaceRepository.findOne({
      where: {
        workspaceUniqueId: teamExists.workspace.workspaceUniqueId,
      },
    });

    const team = await this.teamRepository.findOne({
      where: {
        teamName: updateTeamDto.teamName.trim(),
        teamUniqueId: Not(teamUniqueId),
        workspace: { id: workspace.id },
      },
    });

    if (team) {
      throw new BadRequestException('Team with this name already exists');
    }

    const updatedTeam = await this.teamRepository.save(
      this.teamRepository.create({
        ...updateTeamDto,
        id: teamExists.id,
      }),
    );

    const users = await this.teamUserMappingService.getUserByTeam(updatedTeam);

    await Promise.all(
      users.map(async (teamUser) => {
        await this.teamUserMappingService.remove(updatedTeam, teamUser.user);
      }),
    );

    if (updateTeamDto.userUniqueId) {
      await Promise.all(
        updateTeamDto.userUniqueId.map(async (userUniqueId) => {
          const user = await this.usersService.findByUniqueId(userUniqueId);

          if (user) await this.teamUserMappingService.create(updatedTeam, user);
        }),
      );
    }

    // if (updateTeamDto.userUniqueIdsToRemove) {
    //   await Promise.all(
    //     updateTeamDto.userUniqueIdsToRemove.map(async (userUniqueId) => {
    //       const user = await this.usersService.findByUniqueId(userUniqueId);

    //       if (user) await this.teamUserMappingService.remove(updatedTeam, user);
    //     }),
    //   );
    // }
    if (
      updateTeamDto.teamIdsDeleteForHierarchy &&
      updateTeamDto.teamIdsDeleteForHierarchy.length > 0
    ) {
      const teamsForHierarchy = await this.findIn(
        updateTeamDto.teamIdsDeleteForHierarchy,
      );

      const ids = teamsForHierarchy.map((t) => t.id);

      await this.teamHierarchyService.delete(ids, updatedTeam);
    }

    if (
      updateTeamDto.teamIdsForHierarchy &&
      updateTeamDto.teamIdsForHierarchy.length > 0
    ) {
      const teamsForHierarchy = await this.findIn(
        updateTeamDto.teamIdsForHierarchy,
      );

      const ids = teamsForHierarchy.map((t) => t.id);

      // const ids = await Promise.all(
      //   teamsForHierarchy?.map(async (t) => {
      //     const teamHierarchy = await this.teamHierarchyService.findAllByTeamId(
      //       t.id,
      //     );

      //     if (teamHierarchy.length > 0) {
      //       const ids = teamHierarchy?.map((t) => t.team?.teamUniqueId);

      //       let teams = [];
      //       if (ids?.length > 0) {
      //         teams = await this.findIn(ids);
      //       }

      //       teams?.map((team) => {
      //         if (team.id === updatedTeam.id) {
      //           throw new BadRequestException(
      //             `Team "${t.teamName}" can't be part of current team collection`,
      //           );
      //         }
      //       });
      //     }
      //     return t.id;
      //   }),
      // );

      await this.teamHierarchyService.create(ids, updatedTeam);
    }
  }

  /**
   * delete team
   * @param teamUniqueId
   * @param authAdmin
   */
  async deleteTeam(teamUniqueId: string, authAdmin: Admin) {
    const teamExists = await this.findOneByUniqueId(teamUniqueId);

    if (!teamExists) throw new BadRequestException('Team not exists');

    const tasksAssigned = await this.tasksService.getAllTasksByTeam(
      teamExists.teamUniqueId,
    );

    if (tasksAssigned.length > 0)
      throw new BadRequestException(
        'Please delete or reassign all tasks assigned to the team before proceeding.',
      );

    await this.teamRepository.remove(teamExists);
  }

  /**
   * Find one by unique id
   * @param teamUniqueId
   * @returns
   */
  async findOneByUniqueId(teamUniqueId: string) {
    return this.teamRepository.findOne({
      where: {
        teamUniqueId: teamUniqueId,
      },
      relations: ['workspace'],
    });
  }

  /**
   * Find by workspace and unique ID
   * @param teamUniqueId
   * @param workspaceUniqueId
   * @returns
   */
  async findOneByUniqueIdAndWorkspace(
    teamUniqueId: string,
    workspaceUniqueId: string,
  ) {
    return this.teamRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.workspace', 'w')
      .where('t.teamUniqueId =:teamUniqueId', {
        teamUniqueId: teamUniqueId,
      })
      .andWhere('w.workspaceUniqueId =:workspaceUniqueId', {
        workspaceUniqueId: workspaceUniqueId,
      })
      .getOne();
  }

  async getTeamReportsByWorkspace(
    workspaceUniqueId: string,
    page: number,
    limit: number,
    search: string,
  ) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.teamRepository
      .createQueryBuilder('t')
      .leftJoin('t.workspace', 'w')
      .where('w.workspaceUniqueId =:workspaceUniqueId', {
        workspaceUniqueId: workspaceUniqueId,
      })
      .loadRelationCountAndMap(
        't.tasksAssigned',
        't.totalTasks',
        'task',
        (qb) =>
          qb.where('task.status = :status', { status: TASK_STATUS.ASSIGNED }),
      )
      .loadRelationCountAndMap(
        't.tasksCompleted',
        't.totalTasks',
        'task',
        (qb) =>
          qb.where('task.status = :status', { status: TASK_STATUS.COMPLETED }),
      )
      .loadRelationCountAndMap('t.tasksStarted', 't.totalTasks', 'task', (qb) =>
        qb.where('task.status = :status', { status: TASK_STATUS.STARTED }),
      )
      .loadRelationCountAndMap('t.tasksDue', 't.totalTasks', 'task', (qb) =>
        qb.where('task.endingDateTime <=:endingDateTime', {
          endingDateTime: moment().utc().format('YYYY-MM-DD'),
        }),
      )
      .leftJoinAndMapMany('t.team', TeamUserMapping, 'tum', 't.id = tum.teamId')
      .leftJoinAndMapMany('t.user', Users, 'u', 'u.id = tum.userId');

    if (search && search !== 'undefined') {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(t.teamName) LIKE :search', {
            search: `%${search}%`,
          }).orWhere('LOWER(t.teamDescription) LIKE :search', {
            search: `%${search}%`,
          });
        }),
      );
    }

    queryBuilder.orderBy('t.createdAt', 'DESC').take(limit).skip(skip);

    const totalCount = await queryBuilder.getCount();

    let data = await queryBuilder.getMany();

    if (data) {
      data = await Promise.all(
        data.map(async (team: any) => {
          if (team) {
            const teamHierarchy =
              await this.teamHierarchyService.findAllByTeamId(team.id);

            let totalTasksAssigned = team.tasksAssigned
              ? team.tasksAssigned
              : 0;
            let totalTasksCompleted = team.tasksCompleted
              ? team.tasksCompleted
              : 0;
            let totalTasksStarted = team.tasksStarted ? team.tasksStarted : 0;
            let totalTasksDue = team.tasksDue ? team.tasksDue : 0;

            if (teamHierarchy) {
              teamHierarchy?.map((team: any) => {
                totalTasksAssigned += team.team?.tasksAssigned
                  ? team.team?.tasksAssigned
                  : 0;
                totalTasksCompleted += team.team?.tasksCompleted
                  ? team.team?.tasksCompleted
                  : 0;
                totalTasksStarted += team.team?.tasksStarted
                  ? team.team?.tasksStarted
                  : 0;
                totalTasksDue += team.team?.tasksDue ? team.team?.tasksDue : 0;
              });
            }
            Object.assign(team, { totalTasksAssigned: totalTasksAssigned });
            Object.assign(team, { totalTasksCompleted: totalTasksCompleted });
            Object.assign(team, { totalTasksStarted: totalTasksStarted });
            Object.assign(team, { totalTasksDue: totalTasksDue });
          }

          return team;
        }),
      );
    }

    return {
      data: data,
      meta: {
        total: totalCount,
        limit: limit ? Number(limit) : null,
        page: page ? Number(page) : null,
        totalPages: limit ? Math.ceil(totalCount / limit) : null,
      },
    };
  }

  /**
   * Get team details
   * @param teamUniqueId
   * @returns
   */
  async getTeam(teamUniqueId: string) {
    // console.log('teamUniqueId', teamUniqueId);
    const team = await this.teamRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.workspace', 'w')
      .where('t.teamUniqueId =:teamUniqueId', {
        teamUniqueId: teamUniqueId,
      })
      .leftJoinAndMapMany('t.team', TeamUserMapping, 'tum', 't.id = tum.teamId')
      .leftJoinAndMapMany('t.user', Users, 'u', 'u.id = tum.userId')
      .getOne();

    if (!team) throw new BadRequestException('Team not found');

    // console.log('team', team);

    Object.assign(team, { teamHierarchy: [] });

    if (team) {
      const teamHierarchy = await this.teamHierarchyService.findAllByTeamId(
        team.id,
      );
      // console.log('teamHierarchy', teamHierarchy);
      Object.assign(team, { teamHierarchy });
    }

    return team;
  }

  async getTeamUsers(teamUniqueId: string) {
    const team = await this.teamRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.workspace', 'w')
      .where('t.teamUniqueId =:teamUniqueId', {
        teamUniqueId: teamUniqueId,
      })
      .leftJoinAndMapMany('t.team', TeamUserMapping, 'tum', 't.id = tum.teamId')
      .leftJoinAndMapMany('t.user', Users, 'u', 'u.id = tum.userId')
      .getOne();

    return team;
  }

  /**
   * Find one by unique id
   * @param teamUniqueId
   * @returns
   */
  async findOne(teamId: number) {
    return this.teamRepository.findOne({
      where: {
        id: teamId,
      },
    });
  }

  async findIn(teamUniqueIds: Array<string>) {
    return this.teamRepository
      .createQueryBuilder('t')
      .where('teamUniqueId IN (:...teamUniqueIds)', { teamUniqueIds })
      .getMany();
  }

  /**
   * Team list
   * @param authAdmin
   * @param options
   * @param workspaceUniqueId
   * @returns
   */
  async teamList(
    authAdmin: Admin,
    // options: IPaginationOptions,
    workspaceUniqueId: string,
    page: number,
    limit: number,
    search: string,
  ) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.teamRepository
      .createQueryBuilder('t')
      .where('adminId =:id', { id: authAdmin.id })
      .leftJoinAndSelect('t.workspace', 'w')
      .where('w.workspaceUniqueId =:workspaceUniqueId', {
        workspaceUniqueId: workspaceUniqueId,
      })
      .loadRelationCountAndMap('t.tasksDone', 't.totalTasks', 'task', (qb) =>
        qb.where('task.status = :status', { status: TASK_STATUS.COMPLETED }),
      )
      .loadRelationCountAndMap('t.totalTasks', 't.totalTasks')
      .leftJoinAndMapMany('t.team', TeamUserMapping, 'tum', 't.id = tum.teamId')
      .leftJoinAndMapMany('t.user', Users, 'u', 'u.id = tum.userId');

    if (search && search !== 'undefined') {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(t.teamName) LIKE :search', {
            search: `%${search}%`,
          }).orWhere('LOWER(t.teamDescription) LIKE :search', {
            search: `%${search}%`,
          });
        }),
      );
    }

    queryBuilder.orderBy('t.createdAt', 'DESC').take(limit).skip(skip);

    const totalCount = await queryBuilder.getCount();

    return {
      data: await queryBuilder.getMany(),
      meta: {
        total: totalCount,
        limit: limit ? Number(limit) : null,
        page: page ? Number(page) : null,
        totalPages: limit ? Math.ceil(totalCount / limit) : null,
      },
    };
  }

  /**
   * export teams
   * @param workspaceUniqueId
   * @returns
   */
  async exportTeamDetails(workspaceUniqueId: string): Promise<any> {
    const teams = await this.teamRepository.find({
      where: {
        workspace: { workspaceUniqueId: workspaceUniqueId },
      },
    });

    if (!teams || teams.length <= 0) {
      throw new BadRequestException('No teams found');
    }

    return await createXlsxFile(
      teams,
      `teams_${workspaceUniqueId}`,
      EXPORT_FILENAME.TEAM_MODULE,
    );
  }
}
