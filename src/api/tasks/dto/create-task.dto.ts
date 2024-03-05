import { ApiProperty } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { INTERVALS, TASK_PRIORITY, TASK_STATUS } from '../entities/task.entity';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Keep Carnival event ',
  })
  @IsNotEmpty({
    message: 'Task name is required',
  })
  @IsString({
    message: 'Task name is required',
  })
  taskName: string;

  @ApiProperty({
    example: 'Keep Carnival event ',
  })
  @IsNotEmpty({
    message: 'Task description is required',
  })
  @IsString({
    message: 'Task description is required',
  })
  taskDescription: string;

  @ValidateIf((o) => o.assignedToTeamUniqueId == null)
  @IsNotEmpty({
    message: 'Please select at least one user or team',
  })
  @IsString({
    message: 'Please select at least one user or team',
  })
  @ApiProperty({
    example: 'U55fa170f1678683664',
    required: false,
  })
  assignedToUserUniqueId: string;

  @ValidateIf((o) => o.assignedToUserUniqueId == null)
  @IsNotEmpty({
    message: 'Please select at least one user or team',
  })
  @IsString({
    message: 'Please select at least one user or team',
  })
  @ApiProperty({
    example: 'Ty5fa170f1678683664',
    required: false,
  })
  assignedToTeamUniqueId: string;

  @ApiProperty({
    example: 'C60db999e1685094933',
    required: false,
  })
  @IsOptional()
  assignedToClassesAndDivisionUniqueId: string;

  @IsNotEmpty({
    message: 'Academic year is required',
  })
  @ApiProperty({
    example: 1,
    required: true,
  })
  academicYear?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'Ty5fa170f1678683664',
    required: false,
    description: 'Parent task unique ID for SUB-TASK',
  })
  parentTaskUniqueId: string;

  @ApiProperty({
    example: ['decoration', 'event'],
    required: false,
  })
  @IsOptional()
  // @IsArray()
  // @IsString({ each: true })
  readonly tags?: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  // @IsArray()
  @IsOptional()
  // @IsString({ each: true })
  readonly attachments?: Array<string>;

  @IsString({
    message: 'Priority of the task is required',
  })
  @ApiProperty({ example: TASK_PRIORITY.HIGH, required: false })
  @IsIn([
    TASK_PRIORITY.HIGH,
    TASK_PRIORITY.LOW,
    TASK_PRIORITY.NORMAL,
    TASK_PRIORITY.URGENT,
  ])
  @IsOptional()
  priority: string;

  @ApiProperty({
    example: 'false',
  })
  @IsOptional()
  @IsBooleanString()
  readonly isArchived?: string;

  @ApiProperty({
    example: '20',
  })
  @IsOptional()
  @IsNumberString()
  readonly progressInPerecentage: string;

  @IsString()
  @ApiProperty({ example: TASK_STATUS.STARTED, required: false })
  @IsIn([
    TASK_STATUS.ASSIGNED,
    TASK_STATUS.CHECKED,
    TASK_STATUS.COMPLETED,
    TASK_STATUS.FOLLOW_UP,
    TASK_STATUS.NOT_APPLICABLE,
    TASK_STATUS.NOT_ASSIGNED,
    TASK_STATUS.STARTED,
  ])
  @IsOptional()
  status: string;

  // @IsNotEmpty()
  // @IsNumberString()
  @ApiProperty({
    example: '12',
    required: false,
  })
  @IsOptional()
  reminderIntervalNumber: number;

  @ValidateIf((o) => o.reminderIntervalNumber != null)
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: INTERVALS.DAILY })
  // @IsNotEmpty()
  // @IsIn([
  //   INTERVALS.DAILY,
  //   INTERVALS.MONTHLY,
  //   INTERVALS.ONGOING,
  //   INTERVALS.QUARTERLY,
  //   INTERVALS.WEEKLY,
  //   INTERVALS.YEARLY,
  // ])
  reminderInterval: string;

  // @IsNotEmpty()
  // @IsNumberString()
  @ApiProperty({
    example: '23',
    required: false,
  })
  @IsOptional()
  repetitionIntervalNumber: number;

  @ValidateIf((o) => o.repetitionIntervalNumber != null)
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: INTERVALS.DAILY })
  // @IsNotEmpty()
  // @IsIn([
  //   INTERVALS.DAILY,
  //   INTERVALS.MONTHLY,
  //   INTERVALS.ONGOING,
  //   INTERVALS.QUARTERLY,
  //   INTERVALS.WEEKLY,
  //   INTERVALS.YEARLY,
  // ])
  repetitionInterval: string;

  @IsOptional()
  // @IsNumberString()
  @ApiProperty({
    example: '120',
    required: false,
  })
  @MaxLength(35996400, {
    message: 'The estimated time should not exceed 9999 hours.',
    context: {
      value: 35996400,
    },
  })
  estimatedTimeInSeconds: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'W80eeabcb1678013474' })
  workspaceUniqueId: string;

  @IsNotEmpty({
    message: 'Start date of the task is required',
  })
  @ApiProperty({
    example: '1679917558',
    description: 'UTC unix timestamp',
  })
  startingDateTime: number;

  @IsNotEmpty({
    message: 'End date of the task is required',
  })
  @ApiProperty({
    example: '1679917558',
    description: 'UTC unix timestamp',
  })
  endingDateTime: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '11:00:00',
    description: 'UTC time',
    required: false,
  })
  toBeDoneAtFrom: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '16:00:00',
    description: 'UTC time',
    required: false,
  })
  toBeDoneAtTo: number;

  //   @IsNotEmpty()
  //   endingDateTime: number;

  // TODO: academinc year
  // TODO: Repeat task management
}
