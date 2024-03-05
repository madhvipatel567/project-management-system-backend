import { Module } from '@nestjs/common';
import { TaskCommentsService } from './task-comments.service';
import { TaskCommentsController } from './task-comments.controller';
import { RolePermissionMappingModule } from '../role-permission-mappings/role-permission-mapping..module';
import { TaskComment } from './entities/task-comment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from '../tasks/tasks.module';
import { TaskActivitiesModule } from '../task-activities/task-activities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskComment]),
    RolePermissionMappingModule,
    TasksModule,
    TaskActivitiesModule,
  ],
  controllers: [TaskCommentsController],
  providers: [TaskCommentsService],
})
export class TaskCommentsModule {}
