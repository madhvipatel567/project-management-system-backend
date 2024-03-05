import { forwardRef, Module } from '@nestjs/common';
import { SuperAdminsController } from './super-admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokensModule } from 'src/refresh-tokens/refresh-tokens.module';
import { AccessTokensModule } from 'src/access-tokens/access-tokens.module';
import { JwtStrategy } from 'src/common/passport/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { SuperAdmin } from './entities/super-admin.entity';
import { SuperAdminService } from './super-admin.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SuperAdmin]),
    AccessTokensModule,
    RefreshTokensModule,
    PassportModule,
    forwardRef(() => UsersModule),
    forwardRef(() => AdminModule),
  ],
  controllers: [SuperAdminsController],
  providers: [SuperAdminService, JwtStrategy],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
