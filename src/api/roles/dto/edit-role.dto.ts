import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class EditRoleDto {
  @ApiProperty({
    example: 'Management',
  })
  @IsNotEmpty()
  roleName: string;

  @ApiProperty({
    example: 'Lorem ipsum dolor sit amet consectetur. Porttitor do',
  })
  @IsNotEmpty()
  roleDescription: string;
}
