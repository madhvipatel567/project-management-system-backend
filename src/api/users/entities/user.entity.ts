import { PROVIDER_TYPES } from 'src/common/constants';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from 'src/api/roles/entities/role.entity';
import { Exclude, Expose, Transform } from 'class-transformer';
import { Task } from 'src/api/tasks/entities/task.entity';

@Entity()
export class Users {
  public jti?: string;

  @Expose({ name: 'id' })
  @Transform(({ value }) => Number(value))
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @Column({
    unique: true,
    type: 'varchar',
    length: 100,
  })
  userUniqueId!: string;

  @Column({
    nullable: true,
  })
  name: string;

  @Column({
    unique: true,
  })
  email: string;

  @Column({
    nullable: true,
  })
  @Column({ default: null })
  profilePic: string;

  @Column({
    default: null,
  })
  providerId: string;

  @Exclude()
  @Column({ default: null })
  password: string;

  @Column({
    nullable: true,
  })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: PROVIDER_TYPES,
    nullable: true,
  })
  providerType!: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({
    nullable: true,
  })
  country: string;

  @Column({
    nullable: true,
  })
  state: string;

  @Column({
    nullable: true,
  })
  city: string;

  @Column({
    nullable: true,
  })
  pincode: string;

  @Column({
    nullable: true,
  })
  points: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({
    type: 'boolean',
    nullable: true,
  })
  isActive?: boolean;

  @Column({
    type: 'boolean',
    nullable: true,
  })
  isNotificationOn?: boolean;

  @Column({
    type: 'boolean',
    nullable: true,
  })
  isEmailMessageOn?: boolean;

  @Column({
    nullable: true,
  })
  phone: string;

  @ManyToOne(() => Role, (role) => role.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  role!: Role;

  @Column({ type: 'timestamp', default: null })
  lastLoggedInAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  deletedAt!: Date;

  @OneToMany(() => Task, (task) => task.assignedToUser)
  totalTasks: Task[];
}
