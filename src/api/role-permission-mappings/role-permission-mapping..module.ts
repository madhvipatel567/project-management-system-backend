import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermissionMappingService } from './role-permission-mapping..service';
import { RolePermissionMappingController } from './role-permission-mapping..controller';
import { RolePermissionMapping } from './entities/role-permission-mapping.entity';
import { PermissionModule } from '../permissions/permission.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RolePermissionMapping]),
    PermissionModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [RolePermissionMappingController],
  providers: [RolePermissionMappingService],
  exports: [RolePermissionMappingService],
})
export class RolePermissionMappingModule {}
