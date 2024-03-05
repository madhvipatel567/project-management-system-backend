import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateTaskAttachmentDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  readonly attachments?: Array<string>;

  @IsString()
  @ApiProperty({
    example: 'Ty5fa170f1678683664',
    required: false,
  })
  taskUniqueId: string;
}
