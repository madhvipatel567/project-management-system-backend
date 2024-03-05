import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTaskCommentDto {
  @ApiProperty({
    example: 'Keep Carnival event ',
  })
  @IsNotEmpty({
    message: 'Task description is required',
  })
  @IsString({
    message: 'Task description is required',
  })
  comment: string;

  @ApiProperty({
    example: 'Te19a71d11681214536',
  })
  @IsNotEmpty()
  @IsString()
  taskUniqueId: string;

  @ApiProperty({
    example: false,
  })
  @IsOptional()
  isPrivate: boolean;
}
