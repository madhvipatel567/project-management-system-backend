import { Injectable } from '@nestjs/common';
import { CreateTaskUserPersonalReminderDto } from './dto/create-task-user-personal-reminder.dto';
import { UpdateTaskUserPersonalReminderDto } from './dto/update-task-user-personal-reminder.dto';

@Injectable()
export class TaskUserPersonalRemindersService {
  create(createTaskUserPersonalReminderDto: CreateTaskUserPersonalReminderDto) {
    return 'This action adds a new taskUserPersonalReminder';
  }

  findAll() {
    return `This action returns all taskUserPersonalReminders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} taskUserPersonalReminder`;
  }

  update(
    id: number,
    updateTaskUserPersonalReminderDto: UpdateTaskUserPersonalReminderDto,
  ) {
    return `This action updates a #${id} taskUserPersonalReminder`;
  }

  remove(id: number) {
    return `This action removes a #${id} taskUserPersonalReminder`;
  }
}
