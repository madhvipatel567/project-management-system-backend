import { ApiExcludeController } from '@nestjs/swagger';
import { Controller } from '@nestjs/common';
import { MasterAdminService } from './master-admin.service';

@Controller('master-admin')
@ApiExcludeController()
export class MasterAdminController {
  constructor(private readonly masterAdminService: MasterAdminService) {}
}
