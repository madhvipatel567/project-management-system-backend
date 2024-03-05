import { PartialType } from '@nestjs/swagger';
import { CreateClassesAndDivisionDto } from './create-classes-and-division.dto';

export class UpdateClassesAndDivisionDto extends PartialType(
  CreateClassesAndDivisionDto,
) {}
