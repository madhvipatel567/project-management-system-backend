import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HTTP_SUCCESS_GET, HTTP_SUCCESS_POST } from 'src/common/constants';
import {
  Permissions,
  Roles,
} from 'src/common/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import {
  ACADEMIC_YEAR_LISTING,
  BAD_REQUEST_RESPONSE,
  GET_RESPONSE_SUCCESS,
} from 'src/common/swagger.response';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

@Controller('api/v1/academic-years')
@ApiTags('Academic year')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiBearerAuth()
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  /**
   * Add new academic year
   * @param createAcademicYearDto
   * @returns
   */
  @Post(':workspaceUniqueId')
  @ApiOperation({ summary: 'Add new academic year' })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_POST)
  @Permissions({
    roles: [Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async create(
    @Param('workspaceUniqueId') workspaceUniqueId: string,
    @Body() createAcademicYearDto: CreateAcademicYearDto,
  ) {
    await this.academicYearsService.create(
      workspaceUniqueId,
      createAcademicYearDto,
    );

    return {
      statusCode: HTTP_SUCCESS_POST,
      message: 'Academic year successfully created',
    };
  }

  /**
   * Listout all academic year
   * @param workspaceUniqueId
   */
  @Get(':workspaceUniqueId')
  @ApiOperation({ summary: 'Get academic year list' })
  @ApiResponse(ACADEMIC_YEAR_LISTING)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async findAll(@Param('workspaceUniqueId') workspaceUniqueId: string) {
    const data = await this.academicYearsService.findAll(workspaceUniqueId);

    return {
      statusCode: HTTP_SUCCESS_GET,
      data,
    };
  }

  @ApiOperation({ summary: 'Update academic year by ID' })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  @Patch(':academicYearId')
  async update(
    @Param('academicYearId') academicYearId: number,
    @Body() updateAcademicYearDto: UpdateAcademicYearDto,
  ) {
    await this.academicYearsService.update(
      academicYearId,
      updateAcademicYearDto,
    );

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Academic year successfully updated',
    };
  }

  /**
   * Delete academic year
   * @param academicYearId
   * @returns
   */
  @ApiOperation({ summary: 'Delete academic year by ID' })
  @ApiResponse(GET_RESPONSE_SUCCESS)
  @ApiResponse(BAD_REQUEST_RESPONSE)
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  @Delete(':academicYearId')
  async remove(@Param('academicYearId') academicYearId: number) {
    await this.academicYearsService.remove(academicYearId);

    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Academic year successfully deleted',
    };
  }

  /**
   * export academic years
   * @param res
   * @param workspaceUniqueId
   * @returns
   */
  @Get('export/:workspaceUniqueId')
  @ApiOperation({ summary: 'Export team details' })
  @HttpCode(HTTP_SUCCESS_GET)
  @Permissions({
    roles: [Roles.ADMIN, Roles.SUPERADMIN, Roles.ROLE_BASED_USER],
  })
  async exportAcademicYears(
    @Res({ passthrough: true }) res: Response,
    @Param('workspaceUniqueId') workspaceUniqueId: string,
  ): Promise<StreamableFile> {
    const exportTeamDetails =
      await this.academicYearsService.exportAcademicYearDetails(
        workspaceUniqueId,
      );

    res.set({
      'Content-Type': exportTeamDetails.fileType,
      'Content-Disposition': `attachment; filename=${exportTeamDetails.fileName}`,
    });

    return new StreamableFile(exportTeamDetails.file);
  }
}
