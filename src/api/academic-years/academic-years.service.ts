import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { classToPlain } from 'class-transformer';
import * as moment from 'moment';
import { WorkspaceService } from 'src/api/workspaces/workspace.service';
import { EXPORT_FILENAME } from 'src/common/constants';
import { generateUniqueId } from 'src/common/helper/common.helper';
import { createXlsxFile } from 'src/common/helper/fileupload.helper';
import { Repository } from 'typeorm';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';
import { AcademicYear } from './entities/academic-year.entity';

@Injectable()
export class AcademicYearsService {
  constructor(
    @InjectRepository(AcademicYear)
    private academicYearRepository: Repository<AcademicYear>,

    private workspaceService: WorkspaceService,
  ) {}

  /**
   * Create new academic year
   * @param workspaceUniqueId
   * @param createAcademicYearDto
   */
  async create(
    workspaceUniqueId: string,
    createAcademicYearDto: CreateAcademicYearDto,
  ) {
    const workspace = await this.workspaceService.findOne(workspaceUniqueId);

    if (!workspace) throw new BadRequestException('Workspace not found');

    const checkAlreadyAdded = await this.findByFromAndToDate(
      createAcademicYearDto.from,
      createAcademicYearDto.to,
      workspace,
    );

    if (checkAlreadyAdded)
      throw new BadRequestException('academic year already added.');

    if (createAcademicYearDto.isDefault) {
      await this.academicYearRepository.update(
        { workspace: workspace },
        { isDefault: false },
      );
    }

    const academicYearUniqueId = await generateUniqueId('AY');

    await this.academicYearRepository.save(
      this.academicYearRepository.create({
        ...createAcademicYearDto,
        academicYearUniqueId: academicYearUniqueId,
        from: moment(createAcademicYearDto.from).format('YYYY-MM-DD'),
        to: moment(createAcademicYearDto.to).format('YYYY-MM-DD'),
        workspace: workspace,
      }),
    );
  }

  /**
   * Find by from and to for workspace
   * @param from
   * @param to
   * @param workspace
   * @returns
   */
  async findByFromAndToDate(from, to, workspace) {
    return this.academicYearRepository
      .createQueryBuilder('a')
      .where('a.workspaceId = :workspaceId', { workspaceId: workspace.id })
      .andWhere(`a.from = '${moment(from).format('YYYY-MM-DD')}'`)
      .andWhere(`a.to = '${moment(to).format('YYYY-MM-DD')}'`)
      .getOne();
  }

  /**
   * Find all years
   * @param workspaceUniqueId
   * @returns
   */
  async findAll(workspaceUniqueId: string) {
    const workspace = await this.workspaceService.findOne(workspaceUniqueId);

    if (!workspace) throw new BadRequestException('Workspace not found');

    const academic_years = await this.academicYearRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.workspace', 'w')
      .where('a.workspaceId = :workspaceId', { workspaceId: workspace.id })
      .getMany();

    return academic_years;
  }

  /**
   * find one by ID
   * @param id
   * @returns
   */
  findOne(id: number) {
    return this.academicYearRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.workspace', 'w')
      .where('a.id = :id', { id })
      .getOne();
  }

  /**
   * Find one by workspace and id
   * @param id
   * @param workspaceUniqueId
   * @returns
   */
  findOneByWorkspace(academicYearUniqueId: number, workspaceUniqueId: string) {
    return this.academicYearRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.workspace', 'w')
      .where('a.academicYearUniqueId = :academicYearUniqueId', {
        academicYearUniqueId,
      })
      .andWhere('w.workspaceUniqueId = :workspaceUniqueId', {
        workspaceUniqueId,
      })
      .getOne();
  }

  /**
   * Update by ID
   * @param academicYearId
   * @param updateAcademicYearDto
   */
  async update(
    academicYearId: number,
    updateAcademicYearDto: UpdateAcademicYearDto,
  ) {
    const academicYear = await this.findOne(academicYearId);
    if (!academicYear) throw new BadRequestException('Academic year not found');

    if (updateAcademicYearDto.isDefault) {
      const workspaceId = classToPlain(academicYear).workspace.id;
      await this.academicYearRepository.update(
        { workspace: workspaceId },
        { isDefault: false },
      );
    }

    await this.academicYearRepository.update(academicYear.id, {
      ...updateAcademicYearDto,
      ...(updateAcademicYearDto.from && {
        from: moment(updateAcademicYearDto.from).format('YYYY-MM-DD'),
      }),
      ...(updateAcademicYearDto.to && {
        to: moment(updateAcademicYearDto.to).format('YYYY-MM-DD'),
      }),
    });
  }

  /**
   * Remove academicYear by ID
   * @param academicYearId
   */
  async remove(academicYearId: number) {
    const academicYear = await this.findOne(academicYearId);

    if (!academicYear) throw new BadRequestException('Academic year not found');

    await this.academicYearRepository.remove(academicYear);
  }

  /**
   * export academic years
   * @param workspaceUniqueId
   * @returns
   */
  async exportAcademicYearDetails(workspaceUniqueId: string): Promise<any> {
    const academic_year = await this.academicYearRepository.find({
      where: {
        workspace: { workspaceUniqueId: workspaceUniqueId },
      },
    });

    if (!academic_year || academic_year.length <= 0) {
      throw new BadRequestException('No academic_year found');
    }

    return await createXlsxFile(
      academic_year,
      `AY_${workspaceUniqueId}`,
      EXPORT_FILENAME.ACADEMICYEAR_MODULE,
    );
  }
}
