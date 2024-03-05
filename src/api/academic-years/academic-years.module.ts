import { Module } from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { AcademicYearsController } from './academic-years.controller';
import { AcademicYear } from './entities/academic-year.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceModule } from 'src/api/workspaces/workspace.module';
import { RolePermissionMappingModule } from 'src/api/role-permission-mappings/role-permission-mapping..module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AcademicYear]),
    WorkspaceModule,
    RolePermissionMappingModule,
  ],
  controllers: [AcademicYearsController],
  providers: [AcademicYearsService],
  exports: [AcademicYearsService],
})
export class AcademicYearsModule {}
