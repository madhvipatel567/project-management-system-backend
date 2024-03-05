import { Module } from '@nestjs/common';
import { TaskUserPersonalRemindersService } from './task-user-personal-reminders.service';
import { TaskUserPersonalRemindersController } from './task-user-personal-reminders.controller';

@Module({
  controllers: [TaskUserPersonalRemindersController],
  providers: [TaskUserPersonalRemindersService],
})
export class TaskUserPersonalRemindersModule {}
