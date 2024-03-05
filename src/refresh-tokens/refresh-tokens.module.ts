import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokens } from './entities/refresh-token.entity';
import { RefreshTokensService } from './refresh-tokens.service';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshTokens])],
  providers: [RefreshTokensService],
  exports: [RefreshTokensService],
})
export class RefreshTokensModule {}
