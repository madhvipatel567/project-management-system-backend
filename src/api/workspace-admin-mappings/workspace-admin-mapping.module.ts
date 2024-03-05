import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceAdminMappingService } from './workspace-admin-mapping.service';
import { AdminModule } from '../admin/admin.module';
import { WorkspaceAdminMappingController } from './workspace-admin-mapping.controller';
import { WorkspaceAdminMapping } from './entities/workspace-admin-mapping.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceAdminMapping]), AdminModule],
  controllers: [WorkspaceAdminMappingController],
  providers: [WorkspaceAdminMappingService],
  exports: [WorkspaceAdminMappingService],
})
export class WorkspaceAdminMappingModule {}
