import { Controller, Post, Body, UseGuards, Param } from '@nestjs/common';
import { TaskClassDivisionsMappingService } from './task-class-divisions-mapping.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Role Permissions Mapping')
@Controller('api/v1/task-class-divisions-mapping')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TaskClassDivisionsMappingController {
  constructor(
    private readonly taskClassDivisionsMappingService: TaskClassDivisionsMappingService,
  ) {}
}
