import { Module } from '@nestjs/common';
import { TaskTagsService } from './task-tags.service';
import { TaskTagsController } from './task-tags.controller';
import { RolePermissionMappingModule } from '../role-permission-mappings/role-permission-mapping..module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskTag } from './entities/task-tag.entity';
import { TagsModule } from '../tags/tags.module';
import { WorkspaceModule } from '../workspaces/workspace.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskTag]),
    RolePermissionMappingModule,
    TagsModule,
    WorkspaceModule,
  ],
  controllers: [TaskTagsController],
  providers: [TaskTagsService],
  exports: [TaskTagsService],
})
export class TaskTagsModule {}
