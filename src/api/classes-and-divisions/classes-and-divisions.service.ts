import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { classToPlain } from 'class-transformer';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { generateUniqueId } from 'src/common/helper/common.helper';
import { Repository } from 'typeorm';
import { Classes } from '../workspaces/dto/create-workspace.dto';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { WorkspaceService } from '../workspaces/workspace.service';
import { CreateClassesAndDivisionDto } from './dto/create-classes-and-division.dto';
import { UpdateClassesAndDivisionDto } from './dto/update-classes-and-division.dto';
import { ClassesAndDivision } from './entities/classes-and-division.entity';

@Injectable()
export class ClassesAndDivisionsService {
  constructor(
    @InjectRepository(ClassesAndDivision)
    private classesAndDivisionRepository: Repository<ClassesAndDivision>,

    @Inject(forwardRef(() => WorkspaceService))
    private workspaceService: WorkspaceService,
  ) {}

  /**
   * Create classes and divisions
   * @param createClassesAndDivisionDto
   * @param workspaceUniqueId
   * @returns
   */
  async create(
    authUser,
    createClassesAndDivisionDto: CreateClassesAndDivisionDto,
    workspaceUniqueId: string,
  ) {
    const workspace = await this.workspaceService.findOne(workspaceUniqueId);

    if (!workspace) throw new BadRequestException('Workspace not found');

    const classUniqueId = await generateUniqueId('C');
    const nameDuplication = await this.findOneByNameAndWorkspace(
      createClassesAndDivisionDto.className.trim(),
      workspace,
    );

    if (nameDuplication)
      throw new BadRequestException('Class already exists with this name');

    await this.classesAndDivisionRepository.save(
      this.classesAndDivisionRepository.create({
        ...createClassesAndDivisionDto,
        className: createClassesAndDivisionDto.className.trim(),
        classUniqueId,
        workspace: workspace,
        ...(createClassesAndDivisionDto.divisions && {
          divisions: createClassesAndDivisionDto.divisions.join(','),
        }),
      }),
    );
  }

  /**
   * Duplicate classes and divisions
   * @param classUniqueId
   * @returns
   */
  async duplicate(authUser, classUniqueId: string) {
    const classesAndDivision = await this.classesAndDivisionRepository.findOne({
      where: { classUniqueId: classUniqueId },
      relations: ['workspace'],
    });

    let newName = `${classesAndDivision.className} (copy)`;
    let nameDuplication = null;

    do {
      nameDuplication = await this.findOneByNameAndWorkspace(
        newName,
        classesAndDivision.workspace,
      );

      if (!nameDuplication) {
        break;
      }
      newName = `${nameDuplication.className} (copy)`;
    } while (nameDuplication);

    const newClassUniqueId = await generateUniqueId('C');

    await this.classesAndDivisionRepository.save(
      this.classesAndDivisionRepository.create({
        classUniqueId: newClassUniqueId,
        numberOfDivisions: classesAndDivision.numberOfDivisions,
        divisions: classesAndDivision.divisions,
        workspace: { id: classesAndDivision.workspace.id },
        className: newName,
      }),
    );
  }

  async createMultipleClasses(classes, workspace: Workspace) {
    classes.map(async (c) => {
      const classUniqueId = await generateUniqueId('C');
      await this.classesAndDivisionRepository.save(
        this.classesAndDivisionRepository.create({
          ...c,
          className: c.className.trim(),
          classUniqueId,
          workspace: workspace.id,
        }),
      );
    });
  }

  /**
   * Get all classes
   * @param authUser
   * @param options
   * @param workspaceUniqueId
   * @returns
   */
  async findAll(authUser, options: IPaginationOptions, workspaceUniqueId) {
    const queryBuilder = this.classesAndDivisionRepository
      .createQueryBuilder('c')
      .leftJoin('c.workspace', 'w')
      .where('w.workspaceUniqueId =:workspaceUniqueId', {
        workspaceUniqueId: workspaceUniqueId,
      })
      .orderBy('c.createdAt', 'DESC');

    return await paginate<ClassesAndDivision>(queryBuilder, options);
  }

  /**
   * Find by name and workspace
   * @param name
   * @param workspace
   * @returns
   */
  async findOneByNameAndWorkspace(name: string, workspace: Workspace) {
    return this.classesAndDivisionRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.workspace', 'w')
      .where('w.workspaceUniqueId =:workspaceUniqueId', {
        workspaceUniqueId: workspace.workspaceUniqueId,
      })
      .andWhere('c.className = :className', { className: name })
      .getOne();
  }

  /**
   * Find by unique id
   * @param name
   * @param workspace
   * @returns
   */
  async findOneByUniqueId(classUniqueId: string) {
    return this.classesAndDivisionRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.workspace', 'w')
      .where('c.classUniqueId = :classUniqueId', { classUniqueId })
      .getOne();
  }

  /**
   * Update class
   * @param classUniqueId
   * @param updateClassesAndDivisionDto
   */
  async update(
    classUniqueId: string,
    updateClassesAndDivisionDto: UpdateClassesAndDivisionDto,
  ) {
    const classes = await this.findOneByUniqueId(classUniqueId);
    if (!classes) throw new BadRequestException('Class not found');

    const classInfo = classToPlain(classes);
    const checkDuplicateName = await this.classesAndDivisionRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.workspace', 'w')
      .where('c.classUniqueId != :classUniqueId', { classUniqueId })
      .andWhere('c.className =:className', {
        className: updateClassesAndDivisionDto.className.trim(),
      })
      .andWhere('w.workspaceUniqueId =:workspaceUniqueId', {
        workspaceUniqueId: classInfo.workspace.workspaceUniqueId,
      })
      .getOne();

    if (checkDuplicateName)
      throw new BadRequestException('Class already exists');

    const divisions = updateClassesAndDivisionDto.divisions
      ? updateClassesAndDivisionDto.divisions.map((d) => d.trim())
      : [];

    await this.classesAndDivisionRepository.save(
      this.classesAndDivisionRepository.create({
        ...updateClassesAndDivisionDto,
        className: updateClassesAndDivisionDto.className.trim(),
        classUniqueId,
        ...(updateClassesAndDivisionDto.divisions && {
          divisions: divisions.join(','),
        }),
        id: classes.id,
      }),
    );
  }

  /**
   * Remove class
   * @param classUniqueId
   */
  async remove(classUniqueId: string) {
    const classExists = await this.findOneByUniqueId(classUniqueId);

    if (!classExists) throw new BadRequestException('Class not found');

    await this.classesAndDivisionRepository.remove(classExists);
  }
}
