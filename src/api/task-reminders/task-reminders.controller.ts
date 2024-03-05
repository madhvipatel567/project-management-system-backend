import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TaskRemindersService } from './task-reminders.service';
import { CreateTaskReminderDto } from './dto/create-task-reminder.dto';
import { UpdateTaskReminderDto } from './dto/update-task-reminder.dto';

@Controller('task-reminders')
export class TaskRemindersController {
  constructor(private readonly taskRemindersService: TaskRemindersService) {}

  // @Post()
  // create(@Body() createTaskReminderDto: CreateTaskReminderDto) {
  //   return this.taskRemindersService.create(createTaskReminderDto);
  // }

  // @Get()
  // findAll() {
  //   return this.taskRemindersService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.taskRemindersService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateTaskReminderDto: UpdateTaskReminderDto) {
  //   return this.taskRemindersService.update(+id, updateTaskReminderDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.taskRemindersService.remove(+id);
  // }
}
