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
import { Admin } from '../../admin/entities/admin.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @Column({
    unique: true,
    type: 'varchar',
    length: 100,
  })
  roleUniqueId!: string;

  @Column()
  roleName: string;

  @Column({ type: 'text' })
  roleDescription: string;

  @Column({
    default: false,
  })
  isAuthorized: boolean;

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

  @CreateDateColumn()
  createdAt!: Date;

  @CreateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Users, (user) => user.role)
  totalUsers: Users[];
}
