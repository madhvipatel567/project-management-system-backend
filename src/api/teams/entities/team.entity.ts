import { classToPlain, Exclude, Transform } from 'class-transformer';
import { Admin } from 'src/api/admin/entities/admin.entity';
import { Task } from 'src/api/tasks/entities/task.entity';
import { Users } from 'src/api/users/entities/user.entity';
import { Workspace } from 'src/api/workspaces/entities/workspace.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Team {
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
  teamUniqueId!: string;

  @Column()
  teamName: string;

  @Column({ type: 'text' })
  teamDescription: string;

  // @ManyToOne(() => Admin, (admin) => admin.id, {
  //   onDelete: 'CASCADE',
  //   onUpdate: 'CASCADE',
  // })
  // admin: Admin;

  @ManyToOne(() => Users, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user: Users;

  @ManyToOne(() => Admin, (admin) => admin.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  admin: Admin;

  @ManyToOne(() => Workspace, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  workspace: Workspace;

  @OneToMany(() => Task, (task) => task.assignedToTeam)
  totalTasks: Task[];

  @Exclude()
  @CreateDateColumn()
  createdAt!: Date;

  @Exclude()
  @CreateDateColumn()
  updatedAt!: Date;

  toJSON() {
    return classToPlain(this);
  }
}
