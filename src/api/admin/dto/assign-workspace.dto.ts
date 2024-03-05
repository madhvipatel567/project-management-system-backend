import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AssignWorkspaceDto {
  @ApiProperty({
    example: 'Ahj89dfHj2390',
  })
  @IsNotEmpty()
  adminUniqueId: string;

  @ApiProperty({
    example: 'Wf33a17a11677717446',
  })
  @IsNotEmpty()
  workspaceUniqueId: string;
}
