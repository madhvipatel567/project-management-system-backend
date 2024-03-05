import { PartialType } from '@nestjs/swagger';
import { CreateTaskUserPersonalReminderDto } from './create-task-user-personal-reminder.dto';

export class UpdateTaskUserPersonalReminderDto extends PartialType(
  CreateTaskUserPersonalReminderDto,
) {}
