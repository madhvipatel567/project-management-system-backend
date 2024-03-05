import { Admin } from 'src/api/admin/entities/admin.entity';
import { SuperAdmin } from 'src/api/super-admin/entities/super-admin.entity';
import { Users } from 'src/api/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity()
export class AccessTokens {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => SuperAdmin, (superAdmin) => superAdmin.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  superAdmin!: SuperAdmin;

  @ManyToOne(() => Admin, (admin) => admin.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  admin!: Admin;

  @ManyToOne(() => Users, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user!: Users;

  @Column({ type: 'boolean', default: false })
  revoked: number;

  @Column({ default: null })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @CreateDateColumn()
  updatedAt!: Date;
}
