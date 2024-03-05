import { classToPlain, Exclude, Transform } from 'class-transformer';
import { Team } from 'src/api/teams/entities/team.entity';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class TeamHierarchy {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  @Transform(({ value }) => Number(value))
  id: number;

  @ManyToOne(() => Team, (team) => team.id, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  team: Team;

  @ManyToOne(() => Team, (team) => team.id, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  parent: number;

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
