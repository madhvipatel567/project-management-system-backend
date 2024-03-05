import { PartialType } from '@nestjs/swagger';
import { CreateMasterAdminDto } from './create-master-admin.dto';

export class UpdateMasterAdminDto extends PartialType(CreateMasterAdminDto) {}
