import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  isArray,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class Classes {
  @ApiProperty({ example: 'First' })
  @IsNotEmpty()
  className: string;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  numberOfDivisions: number;
}

export class CreateWorkspaceDto {
  @ApiProperty({
    example: 'Mumbai branch',
  })
  @IsNotEmpty()
  workspaceName: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  image: string;

  @ApiProperty({
    example:
      'Babu Mistry Commercial Station Road Opp. Meera Jewellers Bhayander',
  })
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    example: 'India',
  })
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    example: 'Gujarat',
  })
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    example: 'Surat',
  })
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    example: '388120',
  })
  @IsNotEmpty()
  pincode: string;

  @ApiProperty({
    example: 'walnutedu@mailinator.com',
  })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'https://walnutedu.net/mumbai',
  })
  @IsNotEmpty()
  url: string;

  @ApiProperty({ example: '+91 9878678767' })
  @IsNotEmpty()
  phone1: string;

  @ApiProperty({ example: '+91 9878678768' })
  @IsOptional()
  phone2: string;

  // @ApiProperty({ type: () => Classes })
  // @IsArray()
  @IsOptional()
  classes: string;

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
}
