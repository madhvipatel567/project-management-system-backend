import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'jaymin@uniqualitech.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'R55fad70f1678683664',
  })
  @IsNotEmpty()
  roleUniqueId: string;
}
