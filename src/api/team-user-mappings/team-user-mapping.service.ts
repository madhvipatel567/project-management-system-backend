import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TeamUserMapping } from './entities/team-user-mapping.entity';
import { Team } from '../teams/entities/team.entity';
import { Users } from '../users/entities/user.entity';

@Injectable()
export class TeamUserMappingService {
  constructor(
    @InjectRepository(TeamUserMapping)
    private readonly teamUserMappingRepository: Repository<TeamUserMapping>,
  ) {}

  /**
   * Map team with user
   * @param team
   * @param user
   * @returns
   */
  async create(team: Team, user: Users) {
    return this.teamUserMappingRepository.save(
      this.teamUserMappingRepository.create({
        team,
        user,
      }),
    );
  }

  /**
   * Remove mapping team with user
   * @param team
   * @param user
   * @returns
   */
  async remove(team: Team, user: Users) {
    const teamUser = await this.teamUserMappingRepository
      .createQueryBuilder('tu')
      .leftJoinAndSelect('tu.team', 't')
      .where('t.id =:teamId', { teamId: team.id })
      .leftJoinAndSelect('tu.user', 'u')
      .andWhere('u.id =:userId', { userId: user.id })
      .getOne();

    return await this.teamUserMappingRepository.delete(teamUser.id);
  }

  /**
   * Team list
   * @param authUser
   * @returns
   */
  async getTeamByUser(authUser: Users) {
    const team = await this.teamUserMappingRepository
      .createQueryBuilder('tu')
      .where('tu.userId =:id', { id: authUser.id })
      .orderBy('tu.createdAt', 'DESC')
      .getMany();

    return team;
  }

  /**
   * User list
   * @param team
   * @returns
   */
  async getUserByTeam(team: Team) {
    const user = await this.teamUserMappingRepository.find({
      where: {
        team: { id: team.id },
      },
      relations: ['user'],
    });

    return user;
  }

  /**
   * User list
   * @param team
   * @returns
   */
  async getAllUsersByTeamId(teamId: number) {
    const teamUsers = await this.teamUserMappingRepository
      .createQueryBuilder('t')
      .leftJoin('t.user', 'u')
      .addSelect([
        'u.id',
        'u.userUniqueId',
        'u.email',
        'u.name',
        'u.profilePic',
      ])
      .where('teamId =:teamId', { teamId })
      .getMany();

    return teamUsers.map((tu) => tu.user);
  }
}
