import { classToPlain, Exclude, Transform } from 'class-transformer';
import { castToStorage } from 'src/common/helper/fileupload.helper';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SuperAdmin } from '../../super-admin/entities/super-admin.entity';

@Entity()
export class Workspace {
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
  workspaceUniqueId!: string;

  @Column()
  workspaceName: string;

  @Column({
    nullable: true,
  })
  @Transform(({ value }) => castToStorage(value))
  image: string;

  @Column({ type: 'text' })
  address: string;

  @Column()
  country: string;

  @Column()
  state: string;

  @Column()
  city: string;

  @Column()
  pincode: string;

  @Column()
  email: string;

  @Column()
  url: string;

  @Column()
  phone1: string;

  @Column()
  phone2: string;

  @ManyToOne(() => SuperAdmin, (superAdmin) => superAdmin.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  superAdmin!: SuperAdmin;

  @Exclude()
  @CreateDateColumn()
  createdAt!: Date;

  @Exclude()
  @CreateDateColumn()
  updatedAt!: Date;
}
