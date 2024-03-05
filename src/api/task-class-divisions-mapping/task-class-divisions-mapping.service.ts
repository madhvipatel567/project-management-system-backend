import { Injectable } from '@nestjs/common';
import { CreateTaskClassDivisionsMappingDto } from './dto/create-task-class-divisions-mapping.dto';
import { TaskClassDivisionsMapping } from './entities/task-class-divisions-mapping.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';

@Injectable()
export class TaskClassDivisionsMappingService {
  constructor(
    @InjectRepository(TaskClassDivisionsMapping)
    private taskClassDivisionsMappingRepo: Repository<TaskClassDivisionsMapping>,
  ) {}

  /**
   * Create task classes & divisions
   * @param createTaskClassDivisionsMappingDto
   * @returns
   */
  create(
    createTaskClassDivisionsMappingDto: CreateTaskClassDivisionsMappingDto,
    task: Task,
  ) {
    return 'This action adds a new taskClassDivisionsMapping';
  }
}
