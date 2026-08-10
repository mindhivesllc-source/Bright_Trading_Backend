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

import { Module } from "@nestjs/common";
import {
  ConfigModule,
  ConfigService,
} from "@nestjs/config";
import {
  InjectConnection,
  MongooseModule,
} from "@nestjs/mongoose";
import { Connection } from "mongoose";

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ) => {
        const uri =
          configService.getOrThrow<string>(
            "MONGODB_URI",
          );

        console.log(
          "MONGODB_URI:",
          uri.replace(
            /\/\/([^:]+):([^@]+)@/,
            "//$1:***@",
          ),
        );

        return {
          uri,
        };
      },
    }),
  ],
})
export class DatabaseModule {}