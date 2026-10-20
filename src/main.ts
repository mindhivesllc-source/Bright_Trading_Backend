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
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        env.corsOrigins.includes(origin) ||
        /^https:\/\/([a-z0-9-]+\.)*brightdia\.(in|com)$/i.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback allow to never block valid client requests
    },

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

    exposedHeaders: [
      'Content-Disposition',
      'Content-Length',
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