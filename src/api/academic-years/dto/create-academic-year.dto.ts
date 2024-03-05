import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAcademicYearDto {
  @ApiProperty({ example: '2022-07-01', description: 'YYYY-MM-DD' })
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  from: Date;

  @ApiProperty({ example: '2023-06-31', description: 'YYYY-MM-DD' })
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  to: Date;

  @ApiProperty({ example: 'Academic Year 22-23' })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({ example: false })
  @IsOptional()
  isDefault: boolean;
}
