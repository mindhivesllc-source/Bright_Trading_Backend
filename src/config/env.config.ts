// import 'dotenv/config';

// import type { JwtSignOptions } from '@nestjs/jwt';

// const port = Number(process.env.PORT ?? 4000);
// const mongoUri = process.env.MONGODB_URI;
// const jwtSecret = process.env.JWT_SECRET;
// const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ??
//   '1h') as JwtSignOptions['expiresIn'];
// const jwtIssuer = process.env.JWT_ISSUER ?? 'simple-auth-api';
// const jwtAudience = process.env.JWT_AUDIENCE ?? 'simple-auth-client';
// const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
//   .split(',')
//   .map((origin: string) => origin.trim())
//   .filter(Boolean);

// if (!mongoUri) {
//   throw new Error('MONGODB_URI is missing from .env');
// }

// if (!jwtSecret || jwtSecret.length < 32) {
//   throw new Error('JWT_SECRET must contain at least 32 characters');
// }

// if (!Number.isInteger(port) || port < 1 || port > 65_535) {
//   throw new Error('PORT must be a valid port number');
// }

// export const env = {
//   port,
//   mongoUri,
//   jwtSecret,
//   jwtExpiresIn,
//   jwtIssuer,
//   jwtAudience,
//   corsOrigins,
// } as const;



import 'dotenv/config';

import type {
  JwtSignOptions,
} from '@nestjs/jwt';

const port =
  Number(
    process.env.PORT ?? 4000,
  );

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
    process.env.JWT_EXPIRES_IN ??
    '1h'
  ) as JwtSignOptions['expiresIn'];

const jwtIssuer =
  process.env.JWT_ISSUER ??
  'simple-auth-api';

const jwtAudience =
  process.env.JWT_AUDIENCE ??
  'simple-auth-client';

const corsOrigins =
  (
    process.env.CORS_ORIGINS ??
    'http://localhost:5173,https://brighttradingapp-production.up.railway.app'
  )
    .split(',')
    .map(
      (origin: string) =>
        origin.trim(),
    )
    .filter(Boolean);

if (!mongoUri && !process.env.MONGO_URL) {
  throw new Error(
    'MONGODB_URI or MONGO_URL is missing from environment variables',
  );
}

if (!mongoCoreDb) {
  throw new Error(
    'MONGODB_CORE_DB is missing',
  );
}

if (!mongoKiraDb) {
  throw new Error(
    'MONGODB_KIRA_DB is missing',
  );
}

if (!mongoEasysoftDb) {
  throw new Error(
    'MONGODB_EASYSOFT_DB is missing',
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