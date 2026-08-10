// import { Module } from '@nestjs/common';
// import { APP_GUARD } from '@nestjs/core';
// import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// import { AppController } from './app.controller';
// import { AuthModule } from './auth/auth.module';
// import { DatabaseModule } from './database/database.module';

// @Module({
//   imports: [
//     DatabaseModule,
//     AuthModule,
//     ThrottlerModule.forRoot({
//       throttlers: [{ ttl: 60_000, limit: 100 }],
//     }),
//   ],
//   controllers: [AppController],
//   providers: [
//     {
//       provide: APP_GUARD,
//       useClass: ThrottlerGuard,
//     },
//   ],
// })
// export class AppModule {}

// import { Module } from '@nestjs/common';
// import { JwtModule } from '@nestjs/jwt';
// import { ConfigModule, ConfigService } from '@nestjs/config';

// // Keep your existing imports
// import { AuthController } from './auth/auth.controller';
// import { AuthService } from './auth/auth.service';
// import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
// import { InventoryModule } from './inventory/inventory.module';

// @Module({
//   imports: [
//     ConfigModule,

//     // Keep your existing MongooseModule imports here

//     JwtModule.registerAsync({
//       imports: [ConfigModule,InventoryModule],

//       inject: [ConfigService],

//       useFactory: (configService: ConfigService) => ({
//         secret: configService.getOrThrow<string>('JWT_SECRET'),

//         signOptions: {
//           expiresIn:
//             configService.get<string>('JWT_EXPIRES_IN') || '7d',
//         },
//       }),
//     }),
//   ],

//   controllers: [AuthController],

//   providers: [
//     AuthService,
//     JwtAuthGuard,
//   ],

//   exports: [
//     AuthService,
//     JwtAuthGuard,
//     JwtModule,
//   ],
// })
// export class AuthModule {}

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
// import { ScheduleModule } from "@nestjs/schedule";

import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { InventoryModule } from "./inventory/inventory.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),

    DatabaseModule,
    AuthModule,

    // ScheduleModule.forRoot(),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 200,
        },
      ],
    }),

    InventoryModule,
  ],
})
export class AppModule {}
