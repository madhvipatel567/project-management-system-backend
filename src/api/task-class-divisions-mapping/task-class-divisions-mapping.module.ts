import { Module } from '@nestjs/common';
import { TaskClassDivisionsMappingService } from './task-class-divisions-mapping.service';
import { TaskClassDivisionsMappingController } from './task-class-divisions-mapping.controller';
import { TaskClassDivisionsMapping } from './entities/task-class-divisions-mapping.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TypeOrmModule.forFeature([TaskClassDivisionsMapping])],
  controllers: [TaskClassDivisionsMappingController],
  providers: [TaskClassDivisionsMappingService],
  exports: [TaskClassDivisionsMappingService],
})
export class TaskClassDivisionsMappingModule {}
