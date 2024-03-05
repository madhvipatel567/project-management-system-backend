import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginSuperAdminDto {
  @ApiProperty({
    example: 'john.snow.superadmin@mailinator.com',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter valid email' })
  email: string;

  @ApiProperty({
    example: 'password',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
