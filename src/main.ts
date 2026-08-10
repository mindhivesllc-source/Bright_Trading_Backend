// import 'reflect-metadata';

// import { ValidationPipe } from '@nestjs/common';
// import { NestFactory } from '@nestjs/core';
// import { NestExpressApplication } from '@nestjs/platform-express';
// import helmet from 'helmet';

// import { AppModule } from './app.module';
// import { env } from './config/env.config';

// async function bootstrap(): Promise<void> {
//   const app = await NestFactory.create<NestExpressApplication>(AppModule);

//   app.use(helmet());
//   app.setGlobalPrefix('api');
//   app.enableCors({
//     origin: env.corsOrigins,
//     methods: ['GET', 'POST'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//   });
//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       forbidNonWhitelisted: true,
//       transform: true,
//     }),
//   );

//  await app.listen(env.port, '0.0.0.0');
//   console.log(`Auth API running at http://localhost:${env.port}/api`);
// }

// bootstrap().catch((error: unknown) => {
//   console.error('Failed to start the server:', error);
//   process.exit(1);
// });



import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { setServers } from 'node:dns';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { env } from './config/env.config';

// Forces Node's SRV and TXT queries through public DNS.
// Confirm this is permitted by your office IT policy.
setServers(['8.8.8.8', '1.1.1.1']);

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: env.corsOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Use a local address for local development.
  await app.listen(env.port, '127.0.0.1');

  console.log(`Auth API running at http://localhost:${env.port}/api`);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start the server:', error);
  process.exit(1);
});