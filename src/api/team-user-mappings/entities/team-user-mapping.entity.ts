import { classToPlain, Exclude, Transform } from 'class-transformer';
import { Team } from 'src/api/teams/entities/team.entity';
import { Users } from 'src/api/users/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class TeamUserMapping {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  @Transform(({ value }) => Number(value))
  id: number;

  @ManyToOne(() => Users, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user!: Users;

  @ManyToOne(() => Team, (team) => team.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  team!: Team;

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
