import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateClassesAndDivisionDto {
  @ApiProperty({
    example: 'Class A',
  })
  @IsNotEmpty({
    message: 'classname is required',
  })
  @IsString({
    message: 'classname is required',
  })
  className: string;

  @ApiProperty({
    example: 10,
  })
  @IsNotEmpty()
  @IsNumber()
  numberOfDivisions: number;

  @ApiProperty({
    example: ['DivisionA', 'Division2'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  divisions: string[];
}
