import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    if (
      exception.response &&
      exception.response.message &&
      typeof exception.response.message === 'object'
    ) {
      exception.response.message = exception.response.message[0];
    }
    super.catch(exception, host);
  }
}
