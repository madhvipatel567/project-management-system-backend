import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction } from 'express';
import * as JWT from 'jsonwebtoken';

@Injectable()
export class AuthAdminMiddleware implements NestMiddleware {
  use(req: any, res: any, next: NextFunction) {
    const configService = new ConfigService();
    if (!req.session.token) {
      return res.redirect('/admin/login');
    } else {
      JWT.verify(
        req.session.token,
        configService.get('APP_KEY'),
        function (err: any) {
          if (err) {
            return res.redirect('/admin/login');
          }
        },
      );
    }
    next();
  }
}
