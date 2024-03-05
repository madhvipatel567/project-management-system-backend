import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterSuperAdminDto {
  @ApiProperty({
    example: 'John Snow Super Admin',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'john.snow.superadmin@mailinator.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
