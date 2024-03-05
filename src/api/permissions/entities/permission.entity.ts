import { Expose } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Permission {
  @Expose({ name: 'permissionId' })
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  // @Column({
  //   unique: true,
  //   type: 'varchar',
  //   length: 100,
  // })
  // permissionUniqueId!: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt!: Date;

  @CreateDateColumn()
  updatedAt!: Date;
}
