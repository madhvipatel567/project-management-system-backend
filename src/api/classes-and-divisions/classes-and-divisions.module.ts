import { forwardRef, Module } from '@nestjs/common';
import { ClassesAndDivisionsService } from './classes-and-divisions.service';
import { ClassesAndDivisionsController } from './classes-and-divisions.controller';
import { ClassesAndDivision } from './entities/classes-and-division.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceModule } from '../workspaces/workspace.module';
import { RolePermissionMappingModule } from '../role-permission-mappings/role-permission-mapping..module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassesAndDivision]),
    forwardRef(() => WorkspaceModule),
    RolePermissionMappingModule,
  ],
  controllers: [ClassesAndDivisionsController],
  providers: [ClassesAndDivisionsService],
  exports: [ClassesAndDivisionsService],
})
export class ClassesAndDivisionsModule {}
