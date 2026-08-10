import 'dotenv/config';

import type { JwtSignOptions } from '@nestjs/jwt';

const port = Number(process.env.PORT ?? 4000);
const mongoUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ??
  '1h') as JwtSignOptions['expiresIn'];
const jwtIssuer = process.env.JWT_ISSUER ?? 'simple-auth-api';
const jwtAudience = process.env.JWT_AUDIENCE ?? 'simple-auth-client';
const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((origin: string) => origin.trim())
  .filter(Boolean);

if (!mongoUri) {
  throw new Error('MONGODB_URI is missing from .env');
}

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters');
}

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('PORT must be a valid port number');
}

export const env = {
  port,
  mongoUri,
  jwtSecret,
  jwtExpiresIn,
  jwtIssuer,
  jwtAudience,
  corsOrigins,
} as const;
