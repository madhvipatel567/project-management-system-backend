import { RolePermissionMappingModule } from './../role-permission-mappings/role-permission-mapping..module';
import { RefreshTokensModule } from 'src/refresh-tokens/refresh-tokens.module';
import { AccessTokensModule } from 'src/access-tokens/access-tokens.module';
import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { RoleModule } from '../roles/role.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users]),
    AccessTokensModule,
    RoleModule,
    RefreshTokensModule,
    forwardRef(() => RolePermissionMappingModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
