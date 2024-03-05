import { Expose, Transform } from 'class-transformer';
import { UserResource } from 'src/api/users/resources/user.resource';

export class TeamResource {
  @Expose({ name: 'id' })
  @Transform(({ value }) => Number(value))
  id: number;

  @Expose()
  teamUniqueId: string;

  @Expose()
  teamName: string;

  @Expose()
  teamDescription: string;

  @Expose()
  tasksDone: number;

  @Expose()
  totalTasks: number;

  @Expose()
  user: UserResource;
}
