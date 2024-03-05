import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TaskUserPersonalRemindersService } from './task-user-personal-reminders.service';
import { CreateTaskUserPersonalReminderDto } from './dto/create-task-user-personal-reminder.dto';
import { UpdateTaskUserPersonalReminderDto } from './dto/update-task-user-personal-reminder.dto';

@Controller('task-user-personal-reminders')
export class TaskUserPersonalRemindersController {
  constructor(
    private readonly taskUserPersonalRemindersService: TaskUserPersonalRemindersService,
  ) {}

  // @Post()
  // create(
  //   @Body()
  //   createTaskUserPersonalReminderDto: CreateTaskUserPersonalReminderDto,
  // ) {
  //   return this.taskUserPersonalRemindersService.create(
  //     createTaskUserPersonalReminderDto,
  //   );
  // }

  // @Get()
  // findAll() {
  //   return this.taskUserPersonalRemindersService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.taskUserPersonalRemindersService.findOne(+id);
  // }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body()
  //   updateTaskUserPersonalReminderDto: UpdateTaskUserPersonalReminderDto,
  // ) {
  //   return this.taskUserPersonalRemindersService.update(
  //     +id,
  //     updateTaskUserPersonalReminderDto,
  //   );
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.taskUserPersonalRemindersService.remove(+id);
  // }
}
