import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBooleanString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Task } from '../entities/task.entity';

export class ImportTaskDto {
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

  @ApiProperty({
    example:
      '[{"taskName":"Invite Students","taskDescription":"Invitations to students : for the farewell party, ask if coming, want to give a speech : content for google form","startDate":"2023-04-10T00:00:00.000Z","estimatedTimeInSeconds":18000,"priority":"Normal","reminderIntervalNumber":1,"reminderInterval":"Yearly","repetitionIntervalNumber":1,"toBeDoneAtFrom":"16:21:10","toBeDoneAtTo":"1899-12-30T12:00:00.000Z","repetitionInterval":"Weekly","startingDateTime":"2023-04-10","endingDateTime":"2023-04-11","parentId":0,"id":3},{"taskName":"Invite Patents","taskDescription":"Invitations to parents : for the farewell dinner, ask if coming, want to give a speech : content for google form","startDate":"2023-04-10T00:00:00.000Z","estimatedTimeInSeconds":18000,"priority":"Normal","reminderIntervalNumber":1,"reminderInterval":"Yearly","repetitionIntervalNumber":1,"toBeDoneAtFrom":"16:21:10","toBeDoneAtTo":"1899-12-30T13:00:00.000Z","repetitionInterval":"Weekly","startingDateTime":"2023-04-10","endingDateTime":"2023-04-11","parentId":0,"id":4},{"taskName":"Make Birthday Cards - Subtask","taskDescription":"Prepare birthday cards PDFs and cards every month. This event should be repeated at every end of the month.","startDate":"2023-04-12T00:00:00.000Z","estimatedTimeInSeconds":3600,"priority":"High","reminderIntervalNumber":1,"reminderInterval":"Monthly","repetitionIntervalNumber":1,"toBeDoneAtFrom":"16:21:10","toBeDoneAtTo":"1899-12-30T13:00:00.000Z","repetitionInterval":"Weekly","startingDateTime":"2023-04-12","endingDateTime":"2023-04-13","parentId":4,"id":5},{"taskName":"Preapre musics - subtask","taskDescription":"Song playlist for rampwalk. Prepare your favourite songs and share list of musics with your upper department","startDate":"2023-04-13T00:00:00.000Z","estimatedTimeInSeconds":21600,"priority":"Urgent","reminderIntervalNumber":1,"reminderInterval":"Yearly","repetitionIntervalNumber":1,"toBeDoneAtFrom":"17:21:10","toBeDoneAtTo":"1899-12-30T18:00:00.000Z","repetitionInterval":"Weekly","startingDateTime":"2023-04-13","endingDateTime":"2023-04-14","parentId":4,"id":6}]',
  })
  @IsOptional()
  readonly tasks?: string;
}
