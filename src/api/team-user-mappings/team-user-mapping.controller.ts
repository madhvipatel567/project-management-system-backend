import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TeamUserMappingService } from './team-user-mapping.service';

@ApiTags('Workspaces mapping')
@Controller()
export class TeamUserMappingController {
  constructor(
    private readonly TeamUserMappingService: TeamUserMappingService,
  ) {}
}
