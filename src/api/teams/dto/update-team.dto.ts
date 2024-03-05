import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional } from 'class-validator';
import { CreateTeamDto } from './create-team.dto';

export class UpdateTeamDto {
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
    example: ['T278458901212'],
  })
  @IsOptional()
  @IsArray()
  teamIdsForHierarchy: string[];

  @ApiProperty({
    example: ['T278458901212'],
  })
  @IsOptional()
  @IsArray()
  teamIdsDeleteForHierarchy: string[];
}
