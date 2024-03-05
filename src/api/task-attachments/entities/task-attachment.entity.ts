import { classToPlain, Exclude, Transform } from 'class-transformer';
import { Task } from 'src/api/tasks/entities/task.entity';
import { castToStorage } from 'src/common/helper/fileupload.helper';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MEDIA_TYPES {
  IMAGE = 'image',
  VIDEO = 'video',
  PDF = 'pdf',
  DOCUMENT = 'doc',
}

@Entity()
export class TaskAttachment {
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
  attachmentUniqueId!: string;

  @ManyToOne(() => Task, (task) => task.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  task: Task;

  @Column()
  @Transform(({ value }) => (value ? castToStorage(value) : null))
  media!: string;

  @Column()
  originalname!: string;

  @Column({
    type: 'enum',
    enum: MEDIA_TYPES,
    nullable: true,
  })
  mediaType!: string;

  @Column({
    nullable: true,
  })
  @Transform(({ value }) => (value ? castToStorage(value) : null))
  mediaThumbnail!: string;

  @Column({ nullable: true })
  seconds!: string;

  @Exclude()
  @Column({ default: false })
  isTaskCompletedAttachment: boolean;

  @Exclude()
  @CreateDateColumn()
  createdAt!: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt!: Date;

  toJSON() {
    return classToPlain(this);
  }
}
