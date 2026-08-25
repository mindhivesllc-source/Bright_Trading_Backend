import 'dotenv/config';

import type {
  JwtSignOptions,
} from '@nestjs/jwt';

const port =
  Number(process.env.PORT ?? 8080);

const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  '';

const mongoCoreDb =
  process.env.MONGODB_CORE_DB ||
  'bright_core';

const mongoKiraDb =
  process.env.MONGODB_KIRA_DB ||
  'bright_kira';

const mongoEasysoftDb =
  process.env.MONGODB_EASYSOFT_DB ||
  'bright_easysoft';

const jwtSecret =
  process.env.JWT_SECRET || '';

const jwtExpiresIn =
  (
    process.env.JWT_EXPIRES_IN ?? '1h'
  ) as JwtSignOptions['expiresIn'];

const jwtIssuer =
  process.env.JWT_ISSUER ||
  'simple-auth-api';

const jwtAudience =
  process.env.JWT_AUDIENCE ||
  'simple-auth-client';

const corsOrigins =
  (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o: string) => o.trim())
    .filter(Boolean);

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