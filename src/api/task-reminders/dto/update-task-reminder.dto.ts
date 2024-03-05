import { PartialType } from '@nestjs/swagger';
import { CreateTaskReminderDto } from './create-task-reminder.dto';

export class UpdateTaskReminderDto extends PartialType(CreateTaskReminderDto) {}
