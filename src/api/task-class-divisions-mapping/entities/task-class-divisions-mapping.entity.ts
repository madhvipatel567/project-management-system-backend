import { Exclude, Transform, classToPlain } from 'class-transformer';
import moment from 'moment';
import { ClassesAndDivision } from 'src/api/classes-and-divisions/entities/classes-and-division.entity';
import { Task } from 'src/api/tasks/entities/task.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class TaskClassDivisionsMapping {
  @Exclude()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  @Transform(({ value }) => Number(value))
  id: number;

  @ManyToOne(() => Task, (task) => task.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  task: Task;

  @ManyToOne(
    () => ClassesAndDivision,
    (classesAndDivision) => classesAndDivision.id,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  class: ClassesAndDivision;

  @Column({ nullable: true })
  @Transform(({ value }) => (value ? value.split(',') : []))
  divisions: string;

  @CreateDateColumn()
  @Transform(({ value }) => moment(value).unix())
  createdAt!: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt!: Date;

  toJSON() {
    return classToPlain(this);
  }
}
