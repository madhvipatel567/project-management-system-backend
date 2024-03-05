import { Tag } from 'src/api/tags/entities/tag.entity';
import { Task } from 'src/api/tasks/entities/task.entity';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class TaskTag {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ManyToOne(() => Task, (task) => task.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  task: Task;

  @ManyToOne(() => Tag, (tag) => tag.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  tag: Tag;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
