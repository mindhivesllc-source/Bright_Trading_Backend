import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { setServers } from 'node:dns';

import helmet from 'helmet';

import { AppModule } from './app.module';
import { env } from './config/env.config';

/*
 * Forces Node DNS queries through public DNS.
 * Keep this if it is required for your MongoDB Atlas
 * SRV connection in your current environment.
 */
setServers([
  '8.8.8.8',
  '1.1.1.1',
]);

async function bootstrap(): Promise<void> {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
    );

  /*
   * Security headers
   */
  app.use(helmet());

  /*
   * All API routes start with /api
   */
  app.setGlobalPrefix('api');

  /*
   * Frontend access. Falls back to localhost:5173
   * (see env.config.ts) if CORS_ORIGINS is unset.
   */
  app.enableCors({
    origin: env.corsOrigins,

    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],

    credentials: true,
  });

  /*
   * DTO validation
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,

      forbidNonWhitelisted: true,

      transform: true,
    }),
  );

  /*
   * IMPORTANT:
   *
   * 0.0.0.0 works locally AND
   * allows Render / Railway / Hostinger
   * or another hosting provider to reach
   * the NestJS application.
   */
  await app.listen(
    env.port,
    '0.0.0.0',
  );

  console.log(
    `Auth API running on port ${env.port}`,
  );
}

bootstrap().catch(
  (error: unknown) => {
    console.error(
      'Failed to start the server:',
      error,
    );

    process.exit(1);
  },
);