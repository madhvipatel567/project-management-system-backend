import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokensModule } from 'src/refresh-tokens/refresh-tokens.module';
import { AccessTokensService } from './access-tokens.service';
import { AccessTokens } from './entities/access-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessTokens]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('APP_KEY'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
    RefreshTokensModule,
  ],
  providers: [AccessTokensService],
  exports: [AccessTokensService],
})
export class AccessTokensModule {}
