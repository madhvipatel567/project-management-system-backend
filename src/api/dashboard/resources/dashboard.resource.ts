import { Expose, Transform } from 'class-transformer';

export class DashboardResource {
  @Expose()
  numberOfClasses: number;
}
