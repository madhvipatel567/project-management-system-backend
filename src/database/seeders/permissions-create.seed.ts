import { Permission } from 'src/api/permissions/entities/permission.entity';
import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';

export default class CreatePermissions implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    await connection
      .createQueryBuilder()
      .insert()
      .into(Permission)
      .values([
        { name: 'Task Module' },
        { name: 'User Module' },
        { name: 'Team Module' },
        { name: 'Class Module' },
        { name: 'Divisions Module' },
      ])
      .execute();

    console.log(' Seeding completed for: Permissions');
  }
}
