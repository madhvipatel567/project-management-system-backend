import { Controller } from '@nestjs/common';
import { TeamHierarchyService } from './team-hierarchy.service';

@Controller('team-hierarchy')
export class TeamHierarchyController {
  constructor(private readonly teamHierarchyService: TeamHierarchyService) {}
}
