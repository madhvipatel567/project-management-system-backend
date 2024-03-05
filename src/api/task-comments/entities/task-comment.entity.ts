import { classToPlain, Exclude, Transform } from 'class-transformer';
import * as moment from 'moment';
import { Admin } from 'src/api/admin/entities/admin.entity';
import { SuperAdmin } from 'src/api/super-admin/entities/super-admin.entity';
import { Task } from 'src/api/tasks/entities/task.entity';
import { Users } from 'src/api/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class TaskComment {
  @Exclude()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  @Transform(({ value }) => Number(value))
  id: number;

  @Column({
    unique: true,
    type: 'varchar',
    length: 100,
  })
  commentUniqueId!: string;

  @Column({
    type: 'longtext',
  })
  comment!: string;

  @ManyToOne(() => Task, (task) => task.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  task: Task;

  @ManyToOne(() => Users, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  commentedByUser: Users;

  @ManyToOne(() => Admin, (admin) => admin.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  commentedByAdmin: Admin;

  @ManyToOne(() => SuperAdmin, (superadmin) => superadmin.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  commentedBySuperAdmin: SuperAdmin;

  @Column({
    default: false,
  })
  isPrivate: boolean;

  @Transform(({ value }) => moment(value).unix())
  @CreateDateColumn()
  createdAt!: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt!: Date;

  toJSON() {
    return classToPlain(this);
  }
}
