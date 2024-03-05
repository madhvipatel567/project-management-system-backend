import { forwardRef, Module } from '@nestjs/common';
import { TeamHierarchyService } from './team-hierarchy.service';
import { TeamHierarchyController } from './team-hierarchy.controller';
import { TeamHierarchy } from './entities/team-hierarchy.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsModule } from '../teams/teams.module';
import { TeamsService } from '../teams/teams.service';
import { Team } from '../teams/entities/team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TeamHierarchy, Team])],
  controllers: [TeamHierarchyController],
  providers: [TeamHierarchyService],
  exports: [TeamHierarchyService],
})
export class TeamHierarchyModule {}
