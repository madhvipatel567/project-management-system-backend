import { Injectable } from '@nestjs/common';
import { HTTP_SUCCESS_GET } from 'src/common/constants';

@Injectable()
export class ApiService {
  async checkStatus() {
    return {
      statusCode: HTTP_SUCCESS_GET,
      message: 'Success',
      status: 1,
      mode: process.env.API_STATUS,
    };
  }
}
