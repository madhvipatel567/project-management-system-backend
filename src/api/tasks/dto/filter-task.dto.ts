import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsBooleanString,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { TASK_PRIORITY } from '../entities/task.entity';

export class FilterTaskDto {
  @ApiProperty({
    example: 'T774cc2091679024360,T774cc2091679024360',
  })
  @IsOptional()
  @IsString()
  teamIds: string;

  @ApiProperty({
    example: 'U774cc2091679024360,U774cc2091679024360',
  })
  @IsOptional()
  @IsString()
  userIds: string;

  @ApiProperty({
    example: 'decoration,event',
    required: false,
  })
  @IsOptional()
  readonly tags?: string;

  @IsString({
    message: 'Priority of the task is required',
  })
  @ApiProperty({ example: TASK_PRIORITY.HIGH, required: false })
  @IsOptional()
  priority: string;

  @ApiProperty({
    example: 'false',
  })
  @IsOptional()
  @IsBooleanString()
  readonly overdue?: string;

  @ApiProperty({
    example: 'false',
  })
  @IsOptional()
  @IsBooleanString()
  readonly noDates?: string;

  @ApiProperty({
    example: 'false',
  })
  @IsOptional()
  @IsBooleanString()
  readonly dueInNextDay?: string;

  @ApiProperty({
    example: 'false',
  })
  @IsOptional()
  @IsBooleanString()
  readonly dueInNextWeek?: string;

  @ApiProperty({
    example: 'false',
  })
  @IsOptional()
  @IsBooleanString()
  readonly dueInNextMonth?: string;

  @ApiProperty({
    example: 1,
  })
  @IsOptional()
  readonly academicYear?: number;

  @ApiProperty({
    example: false,
  })
  @IsOptional()
  readonly myTasks?: string;
}
