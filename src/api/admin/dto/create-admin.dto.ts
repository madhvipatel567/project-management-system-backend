import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({
    example: 'john.admin@mailinator.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
