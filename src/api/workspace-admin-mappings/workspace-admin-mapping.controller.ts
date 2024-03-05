import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { WorkspaceAdminMappingService } from './workspace-admin-mapping.service';

@ApiTags('Workspaces mapping')
@Controller()
export class WorkspaceAdminMappingController {
  constructor(
    private readonly workspaceAdminMappingService: WorkspaceAdminMappingService,
  ) {}
}
