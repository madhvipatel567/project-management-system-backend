import { classToPlain, Exclude, Transform } from 'class-transformer';
import * as moment from 'moment';
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
export class ClassesAndDivision {
  @Exclude()
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  @Transform(({ value }) => Number(value))
  id: number;

  @ManyToOne(() => Workspace, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  workspace: Workspace;

  @Column({
    unique: true,
    type: 'varchar',
    length: 100,
  })
  classUniqueId!: string;

  @Column()
  className: string;

  @Column()
  numberOfDivisions: number;

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
