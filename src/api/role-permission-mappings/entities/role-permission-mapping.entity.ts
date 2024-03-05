import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity()
export class RolePermissionMapping {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @Column({
    nullable: true,
  })
  name: string;

  @Column('simple-array', { nullable: true })
  operations: string[];

  @Column('simple-array', { nullable: true })
  newOperationsRequested: string[];

  @ManyToOne(() => Permission, (permission) => permission.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  permission: Permission;

  @ManyToOne(() => Role, (role) => role.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  role: Role;

  @CreateDateColumn()
  createdAt!: Date;

  @CreateDateColumn()
  updatedAt!: Date;
}
