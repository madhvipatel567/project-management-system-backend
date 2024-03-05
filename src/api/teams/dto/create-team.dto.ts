import { ApiProperty } from '@nestjs/swagger';
import { IsArray, isArray, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({
    example: 'Republic day Management',
  })
  @IsNotEmpty()
  teamName: string;

  @ApiProperty({
    example: 'Lorem ipsum dolor sit amet consectetur. Porttitor do',
  })
  @IsNotEmpty()
  teamDescription: string;

  @ApiProperty({
    example: ['U278458901212', 'U178458901210'],
  })
  @IsNotEmpty({ message: 'Users are required.' })
  userUniqueId: Array<string>;

  @ApiProperty({
    example: 'W27845890',
  })
  @IsNotEmpty({ message: 'Workspace is required.' })
  workspaceUniqueId: string;

  @ApiProperty({
    example: false,
  })
  @IsOptional()
  isDuplicate: boolean;

  @ApiProperty({
    example: ['T278458901212'],
  })
  @IsOptional()
  @IsArray()
  teamIdsForHierarchy: string[];
}
