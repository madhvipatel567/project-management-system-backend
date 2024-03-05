import { Workspace } from './../workspaces/entities/workspace.entity';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { PermissionModule } from '../permissions/permission.module';
import { RolePermissionMappingModule } from '../role-permission-mappings/role-permission-mapping..module';
import { WorkspaceModule } from '../workspaces/workspace.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    PermissionModule,
    forwardRef(() => RolePermissionMappingModule),
    WorkspaceModule,
  ],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
