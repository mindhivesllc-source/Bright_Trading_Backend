import 'dotenv/config';

import type {
  JwtSignOptions,
} from '@nestjs/jwt';

const port =
  Number(process.env.PORT ?? 8080);

const mongoUri =
  process.env.MONGODB_URI;

const mongoCoreDb =
  process.env.MONGODB_CORE_DB ??
  'bright_core';

const mongoKiraDb =
  process.env.MONGODB_KIRA_DB ??
  'bright_kira';

const mongoEasysoftDb =
  process.env.MONGODB_EASYSOFT_DB ??
  'bright_easysoft';

const jwtSecret =
  process.env.JWT_SECRET;

const jwtExpiresIn =
  (
    process.env.JWT_EXPIRES_IN ?? '1h'
  ) as JwtSignOptions['expiresIn'];

const jwtIssuer =
  process.env.JWT_ISSUER ??
  'simple-auth-api';

const jwtAudience =
  process.env.JWT_AUDIENCE ??
  'simple-auth-client';

const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://brightdia.in',
  'https://www.brightdia.in',
  'https://brightdia.com',
  'https://www.brightdia.com',
];

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin: string) => origin.trim()).filter(Boolean)
  : defaultCorsOrigins;

if (!mongoUri) {
  throw new Error(
    'MONGODB_URI is missing from environment variables',
  );
}

if (
  !jwtSecret ||
  jwtSecret.length < 32
) {
  throw new Error(
    'JWT_SECRET must contain at least 32 characters',
  );
}

if (
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65_535
) {
  throw new Error(
    'PORT must be a valid port number',
  );
}

export const env = {
  port,
  mongoUri,
  mongoCoreDb,
  mongoKiraDb,
  mongoEasysoftDb,
  jwtSecret,
  jwtExpiresIn,
  jwtIssuer,
  jwtAudience,
  corsOrigins,
} as const;