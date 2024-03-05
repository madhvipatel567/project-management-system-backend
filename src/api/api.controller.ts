import { Controller, Get, Render } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { ApiService } from './api.service';

@Controller()
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  /**
   * view API logs
   */
  @ApiExcludeEndpoint()
  @Get('api/changelogs')
  @Render('api/change-logs')
  async apiChangeLogs() {
    return {
      data: true,
    };
  }

  @ApiTags('Status')
  @Get('api/v1/status')
  async checkStatus() {
    const data = await this.apiService.checkStatus();
    return {
      data,
    };
  }
}
