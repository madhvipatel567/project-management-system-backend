import { AppController } from './app.controller';
import { WebModule } from './web/web.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ApiModule } from './api/api.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { join } from 'path';
import { RefreshTokensModule } from './refresh-tokens/refresh-tokens.module';
import { AccessTokensModule } from './access-tokens/access-tokens.module';
import { MasterAdminModule } from './master-admin/master-admin.module';
import { AdminModule } from './api/admin/admin.module';
import { SuperAdminModule } from './api/super-admin/super-admin.module';
import { RoleModule } from './api/roles/role.module';
import { WorkspaceModule } from './api/workspaces/workspace.module';
import { WorkspaceAdminMappingModule } from './api/workspace-admin-mappings/workspace-admin-mapping.module';
import { PermissionModule } from './api/permissions/permission.module';
import { RolePermissionMappingModule } from './api/role-permission-mappings/role-permission-mapping..module';
import { TasksModule } from './api/tasks/tasks.module';
import { TaskAttachmentsModule } from './api/task-attachments/task-attachments.module';
import { TaskRemindersModule } from './api/task-reminders/task-reminders.module';
import { TaskCommentsModule } from './api/task-comments/task-comments.module';
import { TaskUserPersonalRemindersModule } from './api/task-user-personal-reminders/task-user-personal-reminders.module';
import { TagsModule } from './api/tags/tags.module';
import { TaskTagsModule } from './api/task-tags/task-tags.module';
import { TeamHierarchyModule } from './api/team-hierarchy/team-hierarchy.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ClassesAndDivisionsModule } from './api/classes-and-divisions/classes-and-divisions.module';
import { AcademicYearsModule } from './api/academic-years/academic-years.module';
import { TaskActivitiesModule } from './api/task-activities/task-activities.module';
// import { AdminActivitiesModule } from './api/admin-activities/admin-activities.module';
import { TaskClassDivisionsMappingModule } from './api/task-class-divisions-mapping/task-class-divisions-mapping.module';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ormconfig = require('../ormconfig.js');

@Module({
  imports: [
    TypeOrmModule.forRoot(ormconfig),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: +configService.get<number>('MAIL_PORT'),
          ignoreTLS: configService.get<string>('MAIL_ENCRYPTION') !== 'tls',
          secure: configService.get<string>('MAIL_ENCRYPTION') !== 'tls',
          auth: {
            user: configService.get<string>('MAIL_USERNAME'),
            pass: configService.get<string>('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: configService.get<string>('MAIL_FROM_ADDRESS'),
        },
        template: {
          dir: join(__dirname, '/views/emails'),
          adapter: new EjsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
    }),
    ApiModule,
    WebModule,
    RoleModule,
    AccessTokensModule,
    RefreshTokensModule,
    AdminModule,
    SuperAdminModule,
    MasterAdminModule,
    WorkspaceModule,
    WorkspaceAdminMappingModule,
    PermissionModule,
    RolePermissionMappingModule,
    TasksModule,
    TaskAttachmentsModule,
    TaskRemindersModule,
    TaskCommentsModule,
    TaskUserPersonalRemindersModule,
    TagsModule,
    TaskTagsModule,
    TeamHierarchyModule,
    ScheduleModule.forRoot(),
    ClassesAndDivisionsModule,
    AcademicYearsModule,
    TaskActivitiesModule,
    TaskClassDivisionsMappingModule,
    // AdminActivitiesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {
  constructor(private connection: Connection) {}
}
