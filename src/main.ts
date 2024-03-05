import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as firebaseAdmin from 'firebase-admin';
import * as fs from 'fs';
import * as basicAuth from 'express-basic-auth';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  // SSL certificate path
  let httpsOptions: { key: Buffer; cert: Buffer; ca: Buffer[] };
  const isSecure = process.env.IS_SECURE === 'true';

  if (isSecure) {
    const certBasePath = process.env.SSL_CERT_BASE_PATH;
    httpsOptions = {
      key: fs.readFileSync(`${certBasePath}/privkey.pem`),
      cert: fs.readFileSync(`${certBasePath}/cert.pem`),
      ca: [
        fs.readFileSync(`${certBasePath}/cert.pem`),
        fs.readFileSync(`${certBasePath}/fullchain.pem`),
      ],
    };
  }

  const app = isSecure
    ? await NestFactory.create<NestExpressApplication>(AppModule, {
        httpsOptions,
      })
    : await NestFactory.create<NestExpressApplication>(AppModule);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  const configService = app.get(ConfigService);

  app.use(function requireHTTPS(req, res, next) {
    if (isSecure && !req.secure) {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });

  if (process.env.ENVIRONMENT !== 'production') {
    /**
     * Swagger UI
     */
    app.use(
      ['/api/documentation'],
      basicAuth({
        challenge: true,
        users: {
          TaskMGR: '#$TaskMGR:&$101',
        },
      }),
    );
    const config = new DocumentBuilder()
      .setTitle(configService.get<string>('APP_NAME') || 'Task MGR')
      .setDescription(
        'This is a SaaS to manage and plan tasks which are either repetitive or one time for educational institutions',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/documentation', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const allowedOrigins = process.env.CORS_DOMAINS || '';

  const allowedOriginsArray = allowedOrigins
    .split(',')
    .map((item) => item.trim());

  app.enableCors({
    origin: allowedOriginsArray,
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    credentials: true,
  });
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.useStaticAssets(join(__dirname, '..', 'src/views'));
  app.setBaseViewsDir(join(__dirname, '..', 'src/views'));
  app.setViewEngine('ejs');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // exceptionFactory: (errors) => new BadRequestException(errors),
    }),
  );

  // Session
  app.use(
    session({
      secret: configService.get('APP_KEY'),
      resave: 'false',
      saveUninitialized: 'true',
    }),
  );

  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.applicationDefault(),
  });

  await app.listen(configService.get('PORT', 3015), () => {
    console.log(`${configService.get('APP_URL')}`);
  });
}
bootstrap();
