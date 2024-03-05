import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class EditAdminDto {
  @ApiProperty({
    example: 'John Snow Admin',
    required: false,
  })
  @IsOptional()
  name: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  profilePic: string;
}
