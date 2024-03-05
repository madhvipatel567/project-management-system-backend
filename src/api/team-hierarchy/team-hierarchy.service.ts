import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { Repository } from 'typeorm';
import { TASK_STATUS } from '../tasks/entities/task.entity';
import { TeamUserMapping } from '../team-user-mappings/entities/team-user-mapping.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamsService } from '../teams/teams.service';
import { Users } from '../users/entities/user.entity';
import { TeamHierarchy } from './entities/team-hierarchy.entity';

@Injectable()
export class TeamHierarchyService {
  constructor(
    @InjectRepository(TeamHierarchy)
    private teamHierarchyRepository: Repository<TeamHierarchy>,

    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
  ) {}

  /**
   * Create team Hierarchy
   * @param teamIds
   * @param parentTeam
   */
  async create(teamIds: Array<number>, parentTeam: Team) {
    await Promise.all(
      teamIds.map(async (teamId) => {
        const team = await this.teamRepository.findOne({
          where: { id: teamId },
        });
        await this.teamHierarchyRepository.save(
          this.teamHierarchyRepository.create({
            parent: parentTeam.id,
            team: team,
          }),
        );
      }),
    );
  }

  /**
   * Delete team Hierarchy
   * @param teamIds
   * @param parentTeam
   */
  async delete(teamIds: Array<number>, parentTeam: Team) {
    await Promise.all(
      teamIds.map(async (teamId) => {
        const teamHierarchy = await this.teamHierarchyRepository
          .createQueryBuilder('th')
          .where('parentId =:parentId', { parentId: parentTeam.id })
          .andWhere('teamId =:teamId', { teamId: teamId })
          .getOne();

        if (teamHierarchy) {
          await this.teamHierarchyRepository.remove(teamHierarchy);
        }
      }),
    );
  }

  /**
   * Find all by team id
   * @param teamId
   * @returns
   */
  async findAllByTeamId(teamId: number) {
    const details = await this.teamHierarchyRepository
      .createQueryBuilder('th')
      .leftJoinAndSelect('th.team', 't')
      .where('parentId =:parentId', { parentId: teamId })
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
      .leftJoinAndMapMany('t.user', Users, 'u', 'u.id = tum.userId')
      .getMany();

    return details;
  }

  findOne(id: number) {
    return `This action returns a #${id} teamHierarchy`;
  }

  remove(id: number) {
    return `This action removes a #${id} teamHierarchy`;
  }
}
