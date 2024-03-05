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
export class Tag {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @Column({
    unique: true,
    type: 'varchar',
    length: 100,
  })
  tagUniqueId!: string;

  @Column()
  tag: string;

  @Column({
    default: false,
    comment: 'Authorized by super-admin',
  })
  isAuthorized: boolean;

  @Column({
    default: false,
    comment: 'Rejected by super-admin',
  })
  isRejected: boolean;

  @ManyToOne(() => Workspace, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  workspace: Workspace;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
