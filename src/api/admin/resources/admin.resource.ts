import { Expose, Transform, Type } from 'class-transformer';
import { dateToTimestamp, isUrlValid } from 'src/common/helper/common.helper';
import { castToStorage } from 'src/common/helper/fileupload.helper';
import { AuthTokenResource } from 'src/common/resources/auth-token.resource';

export class AdminResource {
  @Expose({ name: 'id' })
  @Transform(({ value }) => Number(value))
  id: number;

  @Expose()
  adminUniqueId: string;

  @Expose()
  @Transform(({ value }) => (isUrlValid(value) ? value : castToStorage(value)))
  profilePic: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  @Transform(({ value }) => (value === undefined ? 'admin' : value))
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
