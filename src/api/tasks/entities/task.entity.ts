import { Team } from 'src/api/teams/entities/team.entity';
import { Users } from 'src/api/users/entities/user.entity';
import { Admin } from 'src/api/admin/entities/admin.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Workspace } from 'src/api/workspaces/entities/workspace.entity';
import { SuperAdmin } from 'src/api/super-admin/entities/super-admin.entity';
import { classToPlain, Exclude, Expose, Transform } from 'class-transformer';
import * as moment from 'moment';
import { TaskAttachment } from 'src/api/task-attachments/entities/task-attachment.entity';
import { TaskComment } from 'src/api/task-comments/entities/task-comment.entity';
import { AcademicYear } from 'src/api/academic-years/entities/academic-year.entity';
import { ClassesAndDivision } from 'src/api/classes-and-divisions/entities/classes-and-division.entity';

export enum TASK_STATUS {
  NOT_ASSIGNED = 'Not assigned',
  ASSIGNED = 'Assigned',
  STARTED = 'Started',
  FOLLOW_UP = 'Follow up',
  COMPLETED = 'Completed',
  CHECKED = 'Checked',
  NOT_APPLICABLE = 'Not applicable',
}

export enum TASK_PRIORITY {
  URGENT = 'Urgent',
  HIGH = 'High',
  NORMAL = 'Normal',
  LOW = 'Low',
}

export enum INTERVALS {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  YEARLY = 'Yearly',
  ONGOING = 'ongoing',
}

@Entity()
export class Task {
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
  taskUniqueId!: string;

  @Column()
  taskName: string;

  @Column({ type: 'text', comment: 'HTML content' })
  taskDescription: string;

  @ManyToOne(() => Users, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  assignedToUser: Users;

  @ManyToOne(() => Team, (team) => team.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  assignedToTeam: Team;

  @ManyToOne(
    () => ClassesAndDivision,
    (classesAndDivision) => classesAndDivision.id,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      nullable: true,
    },
  )
  assignedToClassesAndDivision: ClassesAndDivision;

  @Column({
    type: 'enum',
    enum: TASK_PRIORITY,
    nullable: true,
  })
  priority!: string;

  @Column({
    type: 'enum',
    enum: TASK_STATUS,
    nullable: true,
  })
  status!: string;

  @Column({
    type: 'datetime',
  })
  @Transform(({ value }) => moment(value).unix())
  startingDateTime!: Date;

  @Column({
    type: 'datetime',
  })
  @Transform(({ value }) => moment(value).unix())
  endingDateTime!: Date;

  @Column({
    default: false,
  })
  @Transform(({ value }) => !!value)
  isArchived: boolean;

  @ManyToOne(() => Task, (task) => task.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  parent: Task;

  @ManyToOne(() => Workspace, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  workspace: Workspace;

  @Column({ nullable: true })
  order: number;

  @Column({
    default: false,
    comment: 'authorized by superadmin',
  })
  @Transform(({ value }) => !!value)
  isAuthorized: boolean;

  @ManyToOne(() => Admin, (admin) => admin.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  createdByAdmin: Admin;

  @ManyToOne(() => SuperAdmin, (superadmin) => superadmin.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  createdBySuperAdmin: SuperAdmin;

  @ManyToOne(() => Users, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  createdByUser: Users;

  @ManyToOne(() => AcademicYear, (academicYear) => academicYear.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  academicYear: AcademicYear;

  @Column({ default: 0 })
  progressInPerecentage: string;

  @Column({
    type: 'time',
    nullable: true,
  })
  toBeDoneAtFrom!: Date;

  @Column({
    type: 'time',
    nullable: true,
  })
  toBeDoneAtTo!: Date;

  @Column({
    nullable: true,
    comment: 'e.g. enter "15" for minutes',
  })
  reminderIntervalNumber!: number;

  @Column({
    type: 'enum',
    enum: INTERVALS,
    nullable: true,
  })
  reminderInterval!: string;

  @Column({
    default: false,
  })
  @Transform(({ value }) => !!value)
  isReminderSent: boolean;

  @Column({
    default: false,
  })
  @Transform(({ value }) => !!value)
  isRepeat: boolean;

  @Column({
    default: false,
  })
  @Transform(({ value }) => !!value)
  isRepeated: boolean;

  @Column({
    nullable: true,
    comment: 'e.g. enter "15" for minutes',
  })
  repetitionIntervalNumber!: number;

  @Column({
    type: 'enum',
    enum: INTERVALS,
    nullable: true,
  })
  repetitionInterval!: string;

  @Exclude()
  @Column({
    type: 'datetime',
    nullable: true,
  })
  @Transform(({ value }) => moment(value).unix())
  lastRepeatedAt!: Date;

  @Column({ nullable: true })
  estimatedTimeInSeconds!: number;

  @Exclude()
  @CreateDateColumn()
  createdAt!: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt!: Date;

  toJSON() {
    return classToPlain(this);
  }

  @OneToMany(() => TaskAttachment, (taskAttachment) => taskAttachment.task)
  totalAttachments: TaskAttachment[];

  @OneToMany(() => Task, (task) => task.parent)
  totalSubtasks: Task[];

  @OneToMany(() => TaskComment, (taskComment) => taskComment.task)
  totalComments: TaskComment[];

  // TODO: academinc year
}
