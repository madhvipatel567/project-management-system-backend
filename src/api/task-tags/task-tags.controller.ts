import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TaskTagsService } from './task-tags.service';
import { CreateTaskTagDto } from './dto/create-task-tag.dto';
import { UpdateTaskTagDto } from './dto/update-task-tag.dto';

@Controller('task-tags')
export class TaskTagsController {
  constructor(private readonly taskTagsService: TaskTagsService) {}
}
