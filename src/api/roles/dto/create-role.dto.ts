import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateRoleDto {
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

  @ApiProperty({
    example: 'W27845890',
  })
  @IsNotEmpty({ message: 'Workspace is required.' })
  workspaceUniqueId: string;
}
