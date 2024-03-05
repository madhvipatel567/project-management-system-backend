import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class SuperAdmin {
  public jti?: string;

  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({
    default: 0,
  })
  numberOfTask: number;

  @Column({
    default: 0,
  })
  numberOfUsers: number;

  @Column()
  password: string;

  @Column({
    default: null,
  })
  forgotPasswordCode: string;

  @Column({
    default: null,
  })
  forgotPasswordCodeExpiredAt: Date;

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
