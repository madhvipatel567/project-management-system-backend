import { forwardRef, Module } from '@nestjs/common';
import { TaskAttachmentsService } from './task-attachments.service';
import { TaskAttachmentsController } from './task-attachments.controller';
import { RolePermissionMappingModule } from '../role-permission-mappings/role-permission-mapping..module';
import { TaskAttachment } from './entities/task-attachment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from '../tasks/tasks.module';
import { TaskActivitiesModule } from '../task-activities/task-activities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskAttachment]),
    RolePermissionMappingModule,
    forwardRef(() => TasksModule),
    TaskActivitiesModule,
  ],
  controllers: [TaskAttachmentsController],
  providers: [TaskAttachmentsService],
  exports: [TaskAttachmentsService],
})
export class TaskAttachmentsModule {}
