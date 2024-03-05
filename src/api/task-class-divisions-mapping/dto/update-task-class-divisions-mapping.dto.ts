import { PartialType } from '@nestjs/swagger';
import { CreateTaskClassDivisionsMappingDto } from './create-task-class-divisions-mapping.dto';

export class UpdateTaskClassDivisionsMappingDto extends PartialType(CreateTaskClassDivisionsMappingDto) {}
