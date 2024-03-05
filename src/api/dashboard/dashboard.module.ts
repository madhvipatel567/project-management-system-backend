import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesAndDivision } from '../classes-and-divisions/entities/classes-and-division.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassesAndDivision])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
