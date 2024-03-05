import { PartialType } from '@nestjs/swagger';
import { CreateTaskAttachmentDto } from './create-task-attachment.dto';

export class UpdateTaskAttachmentDto extends PartialType(
  CreateTaskAttachmentDto,
) {}
