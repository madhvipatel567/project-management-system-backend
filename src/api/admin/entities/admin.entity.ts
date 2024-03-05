import { SuperAdmin } from 'src/api/super-admin/entities/super-admin.entity';
import { PROVIDER_TYPES } from 'src/common/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Admin {
  public jti?: string;

  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @Column({
    unique: true,
    type: 'varchar',
    length: 100,
  })
  adminUniqueId!: string;

  @Column({ default: null })
  profilePic: string;

  @Column({ default: null })
  name: string;

  @Column({ default: null })
  password: string;

  @Column({
    default: null,
  })
  forgotPasswordCode: string;

  @Column({
    default: null,
  })
  forgotPasswordCodeExpiredAt: Date;

  @Column({ default: null })
  email: string;

  @Column({
    default: null,
  })
  providerId: string;

  @Column({
    type: 'enum',
    enum: PROVIDER_TYPES,
    nullable: true,
  })
  providerType!: string;

  @ManyToOne(() => SuperAdmin, (superAdmin) => superAdmin.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  superAdmin!: SuperAdmin;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  deletedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @CreateDateColumn()
  updatedAt!: Date;
}
