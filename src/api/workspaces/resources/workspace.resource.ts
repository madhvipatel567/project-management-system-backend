import { Expose, Transform } from 'class-transformer';
import { castToStorage } from 'src/common/helper/fileupload.helper';

export class WorkspaceResource {
  @Expose({ name: 'id' })
  @Transform(({ value }) => Number(value))
  id: number;

  @Expose()
  workspaceUniqueId: string;

  @Expose()
  workspaceName: string;

  @Expose()
  @Transform(({ value }) => castToStorage(value))
  image: string;

  @Expose()
  address: string;

  @Expose()
  country: string;

  @Expose()
  state: string;

  @Expose()
  city: string;

  @Expose()
  pincode: string;

  @Expose()
  email: string;

  @Expose()
  url: string;

  @Expose()
  phone1: string;

  @Expose()
  phone2: string;
}
