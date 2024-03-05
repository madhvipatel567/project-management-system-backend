import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Find all permissions
   * @returns
   */
  async findAll() {
    return this.permissionRepository.createQueryBuilder('p').getMany();
  }

  /**
   * Find one by ID
   * @returns
   */
  async findOne(id: number) {
    return this.permissionRepository
      .createQueryBuilder('p')
      .where('id = :id', { id })
      .getOne();
  }
}
