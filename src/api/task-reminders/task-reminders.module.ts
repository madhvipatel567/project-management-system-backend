import { Module } from '@nestjs/common';
import { TaskRemindersService } from './task-reminders.service';
import { TaskRemindersController } from './task-reminders.controller';

@Module({
  controllers: [TaskRemindersController],
  providers: [TaskRemindersService],
})
export class TaskRemindersModule {}
