import { ApiProperty } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'jaymin@uniqualitech.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 12,
  })
  @IsNotEmpty()
  roleUniqueId: string;
}

export class ImportUserDto {
  @ApiProperty({
    description: 'CSV file',
    format: 'binary',
  })
  @IsOptional()
  readonly csvFile?: string;

  @ApiProperty({
    example: 'W12hjjjf89',
  })
  @IsNotEmpty()
  @IsString()
  readonly workspaceUniqueId?: string;

  @ApiProperty({
    example: 'false',
  })
  @IsOptional()
  @IsBooleanString()
  readonly storeInDatabase?: string;
}
