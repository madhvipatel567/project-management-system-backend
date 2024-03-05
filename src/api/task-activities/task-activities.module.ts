import { forwardRef, Module } from '@nestjs/common';
import { TaskActivitiesService } from './task-activities.service';
import { TaskActivitiesController } from './task-activities.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskActivity } from './entities/task-activity.entity';
import { RolePermissionMappingModule } from '../role-permission-mappings/role-permission-mapping..module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskActivity]),
    RolePermissionMappingModule,
    forwardRef(() => TasksModule),
  ],
  controllers: [TaskActivitiesController],
  providers: [TaskActivitiesService],
  exports: [TaskActivitiesService],
})
export class TaskActivitiesModule {}
