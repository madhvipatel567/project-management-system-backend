import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class EditWorkspaceDto {
  @ApiProperty({
    example: 'Mumbai branch',
    required: false,
  })
  @IsOptional()
  workspaceName: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  image: string;

  @ApiProperty({
    example:
      'Babu Mistry Commercial Station Road Opp. Meera Jewellers Bhayander',
    required: false,
  })
  @IsOptional()
  address: string;

  @ApiProperty({
    example: 'India',
    required: false,
  })
  @IsOptional()
  country: string;

  @ApiProperty({
    example: 'Gujarat',
    required: false,
  })
  @IsOptional()
  state: string;

  @ApiProperty({
    example: 'Surat',
    required: false,
  })
  @IsOptional()
  city: string;

  @ApiProperty({
    example: '388120',
    required: false,
  })
  @IsOptional()
  pincode: string;

  @ApiProperty({
    example: 'walnutedu@mailinator.com',
    required: false,
  })
  @IsOptional()
  email: string;

  @ApiProperty({
    example: 'https://walnutedu.net/mumbai',
    required: false,
  })
  @IsOptional()
  url: string;

  @ApiProperty({ example: '+91 9878678767', required: false })
  @IsOptional()
  phone1: string;

  @ApiProperty({ example: '+91 9878678768', required: false })
  @IsOptional()
  phone2: string;
}
