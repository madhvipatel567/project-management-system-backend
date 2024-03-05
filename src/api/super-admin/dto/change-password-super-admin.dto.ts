import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ChangePasswordSuperAdminDto {
  @ApiProperty({
    example: 'password',
  })
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    example: '12345678',
  })
  @IsNotEmpty()
  password: string;
}
