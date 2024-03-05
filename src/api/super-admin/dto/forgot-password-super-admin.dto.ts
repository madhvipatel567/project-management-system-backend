import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordSuperAdminDto {
  @ApiProperty({
    example: 'john.snow.superadmin@mailinator.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
