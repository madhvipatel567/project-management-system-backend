import { Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiController } from './api.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { Users } from './users/entities/user.entity';
import { SuperAdmin } from './super-admin/entities/super-admin.entity';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { AdminModule } from './admin/admin.module';
import { Admin } from './admin/entities/admin.entity';
import { ClassesModule } from './classes/classes.module';
import { DivisionsModule } from './divisions/divisions.module';
import { TeamsModule } from './teams/teams.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, SuperAdmin, Admin]),
    UsersModule,
    SuperAdminModule,
    AdminModule,
    ClassesModule,
    DivisionsModule,
    TeamsModule,
    DashboardModule,
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
