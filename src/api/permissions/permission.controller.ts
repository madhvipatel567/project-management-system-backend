import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PermissionService } from './permission.service';

@ApiTags('Permissions')
@Controller('api/v1/permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}
}
