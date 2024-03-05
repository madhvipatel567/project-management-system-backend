import { WorkspaceAdminMapping } from './../workspace-admin-mappings/entities/workspace-admin-mapping.entity';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceService } from './workspace.service';
import { AdminModule } from '../admin/admin.module';
import { WorkspacesController } from './workspace.controller';
import { WorkspaceAdminMappingModule } from '../workspace-admin-mappings/workspace-admin-mapping.module';
import { RolePermissionMappingModule } from '../role-permission-mappings/role-permission-mapping..module';
import { ClassesAndDivisionsModule } from '../classes-and-divisions/classes-and-divisions.module';
import { AcademicYear } from '../academic-years/entities/academic-year.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, WorkspaceAdminMapping, AcademicYear]),
    AdminModule,
    RolePermissionMappingModule,
    WorkspaceAdminMappingModule,
    forwardRef(() => ClassesAndDivisionsModule),
  ],
  controllers: [WorkspacesController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
