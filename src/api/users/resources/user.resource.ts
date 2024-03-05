import { Expose, Transform, Type } from 'class-transformer';
import { RoleResource } from 'src/api/roles/resources/role.resource';
import { dateToTimestamp, isUrlValid } from 'src/common/helper/common.helper';
import { castToStorage } from 'src/common/helper/fileupload.helper';
import { AuthTokenResource } from 'src/common/resources/auth-token.resource';

export class UserResource {
  @Expose({ name: 'id' })
  @Transform(({ value }) => Number(value))
  id: number;

  @Expose()
  userUniqueId: string;

  @Expose()
  @Transform(({ value }) => (isUrlValid(value) ? value : castToStorage(value)))
  profilePic: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  @Transform(({ value }) => (value === undefined ? 'user' : value))
  loggedInRole: string;

  @Expose()
  role: RoleResource;

  // @Expose()
  // roleName: string;

  @Expose()
  taskAssigned: number;

  @Expose()
  taskCompleted: number;

  @Expose()
  @Transform(({ value }) => dateToTimestamp(value))
  lastLoggedInAt: Date;

  @Expose()
  @Transform(({ value }) => dateToTimestamp(value))
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => dateToTimestamp(value))
  deletedAt: Date;

  @Expose()
  @Type(() => AuthTokenResource)
  authentication: AuthTokenResource;
}
