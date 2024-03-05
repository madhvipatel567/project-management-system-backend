import { Expose, Transform, Type } from 'class-transformer';
import { dateToTimestamp } from 'src/common/helper/common.helper';
import { AuthTokenResource } from 'src/common/resources/auth-token.resource';

export class SuperAdminResource {
  @Expose({ name: 'id' })
  @Transform(({ value }) => Number(value))
  id: number;

  @Expose()
  uniqueId: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  @Transform(({ value }) => (value === undefined ? 'superadmin' : value))
  loggedInRole: string;

  @Expose()
  numberOfTask: number;

  @Expose()
  numberOfUsers: number;

  @Expose()
  @Transform(({ value }) => dateToTimestamp(value))
  createdAt: Date;

  @Expose()
  @Type(() => AuthTokenResource)
  authentication: AuthTokenResource;
}
