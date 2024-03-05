import { SuperAdmin } from 'src/api/super-admin/entities/super-admin.entity';
import { Module } from '@nestjs/common';
import { ForgetPasswordService } from './forget-password.service';
import { ForgetPasswordController } from './forget-password.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([SuperAdmin])],
  controllers: [ForgetPasswordController],
  providers: [ForgetPasswordService],
})
export class ForgetPasswordModule {}
