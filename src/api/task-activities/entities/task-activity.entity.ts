import { classToPlain, Transform } from 'class-transformer';
import moment from 'moment';
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

export const activityType = {
  TASK_CREATED: 1,
  TASK_UPDATED: 2,
  TASK_COMMENTED: 3,
  TASK_COMMENT_UPDATED: 4,
  TASK_COMMENT_DELETED: 5,
  TASK_ATTACHEMNT_UPLOADED: 6,
  TASK_ATTACHEMNT_DELETED: 7,
};

@Entity()
export class TaskActivity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Task, (task) => task.id, {
    onDelete: 'CASCADE',
  })
  task!: number;

  @ManyToOne(() => Users, (user) => user.id, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  user!: Users;

  @ManyToOne(() => Admin, (admin) => admin.id, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  admin!: Admin;

  @ManyToOne(() => SuperAdmin, (superAdmin) => superAdmin.id, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  superAdmin!: SuperAdmin;

  @Column({
    type: 'longtext',
  })
  body!: string;

  @Column({
    type: 'enum',
    enum: activityType,
  })
  activityType!: number;

  @Transform(({ value }) => (value ? moment.utc(value).unix() : 0), {
    toPlainOnly: true,
  })
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  toJSON() {
    return classToPlain(this);
  }
}
