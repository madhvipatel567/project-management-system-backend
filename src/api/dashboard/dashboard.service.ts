import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HTTP_SUCCESS_GET } from 'src/common/constants';
import { Repository } from 'typeorm';
import { ClassesAndDivision } from '../classes-and-divisions/entities/classes-and-division.entity';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ClassesAndDivision)
    private classesAndDivisionRepository: Repository<ClassesAndDivision>,
  ) {}

  async getDashboardData(workspaceUniqueId: string) {
    const classes = await this.classesAndDivisionRepository.find({
      where: {
        workspace: { workspaceUniqueId: workspaceUniqueId },
      },
      relations: ['workspace'],
    });

    return {
      numberOfClasses: classes.length,
    };
  }
}
