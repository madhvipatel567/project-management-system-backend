import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Operations } from 'src/common/constants';

class RolePermissionMapping {
  @ApiProperty({
    example: 'Task Module',
  })
  @IsNotEmpty()
  @IsString()
  readonly name!: string;

  @ApiProperty({
    example: 1,
  })
  @IsNumber()
  readonly id?: number;

  @ApiProperty({
    example: [Operations.CREATE],
  })
  @IsArray()
  @IsString({ each: true })
  readonly operations?: string[];
}
export class CreateOrUpdateRolePermissionMappingDto {
  @ApiProperty({
    example: [{ id: 1, name: 'Task Module', operations: [Operations.CREATE] }],
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RolePermissionMapping)
  readonly rolePermissions?: RolePermissionMapping[];
}
