import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { TeamUserMapping } from './entities/team-user-mapping.entity';
import { TeamUserMappingController } from './team-user-mapping.controller';
import { TeamUserMappingService } from './team-user-mapping.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeamUserMapping]), AdminModule],
  controllers: [TeamUserMappingController],
  providers: [TeamUserMappingService],
  exports: [TeamUserMappingService],
})
export class TeamUserMappingModule {}
