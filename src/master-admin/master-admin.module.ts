import { Module } from '@nestjs/common';
import { MasterAdminService } from './master-admin.service';
import { MasterAdminController } from './master-admin.controller';

@Module({
  controllers: [MasterAdminController],
  providers: [MasterAdminService],
})
export class MasterAdminModule {}
