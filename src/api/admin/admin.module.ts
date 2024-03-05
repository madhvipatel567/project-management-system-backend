import { Workspace } from 'src/api/workspaces/entities/workspace.entity';
import { WorkspaceAdminMapping } from './../workspace-admin-mappings/entities/workspace-admin-mapping.entity';
import { WorkspaceAdminMappingService } from './../workspace-admin-mappings/workspace-admin-mapping.service';
import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessTokensModule } from 'src/access-tokens/access-tokens.module';
import { JwtStrategy } from 'src/common/passport/jwt.strategy';
import { RefreshTokensModule } from 'src/refresh-tokens/refresh-tokens.module';
import { UsersModule } from '../users/users.module';
import { Admin } from './entities/admin.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SuperAdminModule } from '../super-admin/super-admin.module';
import { RolePermissionMappingModule } from '../role-permission-mappings/role-permission-mapping..module';
import { SendgridService } from 'src/common/services/sendgrid.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, WorkspaceAdminMapping, Workspace]),
    AccessTokensModule,
    RefreshTokensModule,
    PassportModule,
    forwardRef(() => UsersModule),
    RolePermissionMappingModule,
    forwardRef(() => SuperAdminModule),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    JwtStrategy,
    WorkspaceAdminMappingService,
    SendgridService,
  ],
  exports: [AdminService],
})
export class AdminModule {}
