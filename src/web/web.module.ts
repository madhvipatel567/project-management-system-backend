import { Module } from '@nestjs/common';
import { ForgetPasswordModule } from './forget-password/forget-password.module';

@Module({
  imports: [ForgetPasswordModule],
})
export class WebModule {}
