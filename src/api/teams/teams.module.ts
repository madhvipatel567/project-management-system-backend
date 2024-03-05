import { forwardRef, Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { TeamUserMappingModule } from '../team-user-mappings/team-user-mapping.module';
import { UsersModule } from '../users/users.module';
import { RolePermissionMappingModule } from '../role-permission-mappings/role-permission-mapping..module';
import { TasksModule } from '../tasks/tasks.module';
import { TeamHierarchyModule } from '../team-hierarchy/team-hierarchy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, Workspace]),
    TeamUserMappingModule,
    RolePermissionMappingModule,
    UsersModule,
    forwardRef(() => TasksModule),
    TeamHierarchyModule,
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
