import { Injectable } from '@nestjs/common';
import { CreateTaskReminderDto } from './dto/create-task-reminder.dto';
import { UpdateTaskReminderDto } from './dto/update-task-reminder.dto';

@Injectable()
export class TaskRemindersService {
  create(createTaskReminderDto: CreateTaskReminderDto) {
    return 'This action adds a new taskReminder';
  }

  findAll() {
    return `This action returns all taskReminders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} taskReminder`;
  }

  update(id: number, updateTaskReminderDto: UpdateTaskReminderDto) {
    return `This action updates a #${id} taskReminder`;
  }

  remove(id: number) {
    return `This action removes a #${id} taskReminder`;
  }
}
