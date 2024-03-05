import { classToPlain, Exclude, Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { Task } from 'src/api/tasks/entities/task.entity';
import { Workspace } from 'src/api/workspaces/entities/workspace.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class AcademicYear {
  @Expose({ name: 'academicYearId' })
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @Column({
    unique: true,
    type: 'varchar',
    length: 100,
  })
  academicYearUniqueId: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  workspace: Workspace;

  @Column({ nullable: true })
  label!: string;

  @Column({
    type: 'date',
  })
  from!: Date;

  @Column({
    type: 'date',
  })
  to!: Date;

  @CreateDateColumn()
  @Transform(({ value }) => moment(value).unix())
  createdAt!: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({
    default: false,
    comment: 'Default false',
  })
  @Transform(({ value }) => !!value)
  isDefault: boolean;

  toJSON() {
    return classToPlain(this);
  }
}
