import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfig {
  public configService: ConfigService;
  constructor() {
    this.configService = new ConfigService();
  }

  baseUrl(path = '') {
    return this.configService.get('APP_URL') + path;
  }

  storagePath(value = '') {
    return this.baseUrl() + `/storage/${value}`;
  }
}
