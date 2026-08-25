// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';

// import { env } from '../config/env.config';

// @Module({
//   imports: [
//     MongooseModule.forRoot(env.mongoUri, {
//       retryAttempts: 3,
//       retryDelay: 1_000,
//       serverSelectionTimeoutMS: 5_000,
//     }),
//   ],
// })
// export class DatabaseModule {}


// import { Module } from '@nestjs/common';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { MongooseModule } from '@nestjs/mongoose';

// @Module({
//   imports: [
//     MongooseModule.forRootAsync({
//       imports: [ConfigModule],

//       inject: [ConfigService],

//       useFactory: (
//         configService: ConfigService,
//       ) => ({
//         uri: configService.getOrThrow<string>(
//           'MONGODB_URI',
//         ),
//       }),
//     }),
//   ],
// })
// export class DatabaseModule {}

// import { Module } from "@nestjs/common";
// import {
//   ConfigModule,
//   ConfigService,
// } from "@nestjs/config";
// import {
//   InjectConnection,
//   MongooseModule,
// } from "@nestjs/mongoose";
// import { Connection } from "mongoose";

// @Module({
//   imports: [
//     MongooseModule.forRootAsync({
//       imports: [ConfigModule],

//       inject: [ConfigService],

//       useFactory: (
//         configService: ConfigService,
//       ) => {
//         const uri =
//           configService.getOrThrow<string>(
//             "MONGODB_URI",
//           );

//         console.log(
//           "MONGODB_URI:",
//           uri.replace(
//             /\/\/([^:]+):([^@]+)@/,
//             "//$1:***@",
//           ),
//         );

//         return {
//           uri,
//         };
//       },
//     }),
//   ],
// })
// export class DatabaseModule {}



import { Module } from '@nestjs/common';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import {
  MongooseModule,
  MongooseModuleOptions,
} from '@nestjs/mongoose';

import {
  EASYSOFT_DB_CONNECTION,
  KIRA_DB_CONNECTION,
} from './database.constants';

function createMongoOptions(
  configService: ConfigService,
  databaseNameVariable: string,
  uriVariable: string = 'MONGODB_URI',
): MongooseModuleOptions {
  let uri = configService.get<string>(uriVariable);
  
  if (!uri) {
    // Fallback to MONGO_URL which Railway uses by default
    uri = configService.getOrThrow<string>('MONGO_URL');
  }

  const dbName =
    configService.getOrThrow<string>(
      databaseNameVariable,
    );

  return {
    uri,
    dbName,

    serverSelectionTimeoutMS: 15_000,
    connectTimeoutMS: 15_000,
  };
}

@Module({
  imports: [
    /*
     * ----------------------------------------------------
     * DEFAULT CONNECTION
     *
     * Used for:
     * - users
     * - authentication
     * - application data
     *
     * Database:
     * bright_core
     * ----------------------------------------------------
     */
    MongooseModule.forRootAsync({
      imports: [
        ConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      useFactory: (
        configService: ConfigService,
      ) =>
        createMongoOptions(
          configService,
          'MONGODB_CORE_DB',
        ),
    }),

    /*
     * ----------------------------------------------------
     * KIRA CONNECTION
     *
     * Database:
     * bright_kira
     * ----------------------------------------------------
     */
    MongooseModule.forRootAsync({
      connectionName:
        KIRA_DB_CONNECTION,

      imports: [
        ConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      useFactory: (
        configService: ConfigService,
      ) =>
        createMongoOptions(
          configService,
          'MONGODB_KIRA_DB',
        ),
    }),

    /*
     * ----------------------------------------------------
     * EASYSOFT / BRAINTREE CONNECTION
     *
     * Points at the dedicated Brain Tree Mongo
     * instance (MONGO_URL), not the shared
     * MONGODB_URI used by core/kira.
     *
     * Database:
     * bright_easysoft
     * ----------------------------------------------------
     */
    MongooseModule.forRootAsync({
      connectionName:
        EASYSOFT_DB_CONNECTION,

      imports: [
        ConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      useFactory: (
        configService: ConfigService,
      ) =>
        createMongoOptions(
          configService,
          'MONGODB_EASYSOFT_DB',
          'MONGO_URL',
        ),
    }),
  ],
})
export class DatabaseModule {}