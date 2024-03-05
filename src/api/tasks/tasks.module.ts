import { forwardRef, Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskAttachmentsModule } from '../task-attachments/task-attachments.module';
import { TaskTagsModule } from '../task-tags/task-tags.module';
import { RolePermissionMappingModule } from '../role-permission-mappings/role-permission-mapping..module';
import { WorkspaceModule } from '../workspaces/workspace.module';
import { UsersModule } from '../users/users.module';
import { TeamsModule } from '../teams/teams.module';
import { TeamUserMappingModule } from '../team-user-mappings/team-user-mapping.module';
import { TeamHierarchyModule } from '../team-hierarchy/team-hierarchy.module';
import { TaskActivitiesModule } from '../task-activities/task-activities.module';
import { AcademicYear } from '../academic-years/entities/academic-year.entity';
import { AcademicYearsModule } from '../academic-years/academic-years.module';
import { SendgridService } from 'src/common/services/sendgrid.service';
import { Role } from '../roles/entities/role.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, AcademicYear, Role, Workspace]),
    forwardRef(() => TaskAttachmentsModule),
    TaskTagsModule,
    RolePermissionMappingModule,
    WorkspaceModule,
    UsersModule,
    forwardRef(() => TeamsModule),
    TeamUserMappingModule,
    TeamHierarchyModule,
    forwardRef(() => TaskActivitiesModule),
    AcademicYearsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, SendgridService],
  exports: [TasksService],
})
export class TasksModule {}
