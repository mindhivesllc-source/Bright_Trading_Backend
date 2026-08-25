// // // import { HttpModule } from '@nestjs/axios';
// // // import { Module } from '@nestjs/common';
// // // import { ConfigModule, ConfigService } from '@nestjs/config';
// // // import { JwtModule } from '@nestjs/jwt';

// // // import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// // // import { InventoryController } from './inventory.controller';
// // // import { KiraService } from './kira.service';

// // // @Module({
// // //   imports: [
// // //     ConfigModule,

// // //     JwtModule.registerAsync({
// // //       imports: [ConfigModule],
// // //       inject: [ConfigService],

// // //       useFactory: (configService: ConfigService) => ({
// // //         secret:
// // //           configService.getOrThrow<string>('JWT_SECRET'),
// // //       }),
// // //     }),

// // //     HttpModule.register({
// // //       timeout: 30000,
// // //       maxRedirects: 3,
// // //     }),
// // //   ],

// // //   controllers: [InventoryController],

// // //   providers: [
// // //     KiraService,
// // //     JwtAuthGuard,
// // //   ],
// // // })
// // // export class InventoryModule {}


// // import { HttpModule } from '@nestjs/axios';
// // import { Module } from '@nestjs/common';
// // import { JwtModule } from '@nestjs/jwt';

// // import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// // import { InventoryController } from './inventory.controller';
// // import { KiraService } from './kira.service';

// // @Module({
// //   imports: [
// //     HttpModule.register({
// //       timeout: 30_000,
// //       maxRedirects: 3,
// //     }),

// //     /*
// //      * JwtService is created here.
// //      *
// //      * The JWT secret will be supplied by JwtAuthGuard
// //      * during verifyAsync().
// //      */
// //     JwtModule.register({}),
// //   ],

// //   controllers: [InventoryController],

// //   providers: [
// //     KiraService,
// //     JwtAuthGuard,
// //   ],
// // })
// // export class InventoryModule {}






// import {
//   HttpModule,
// } from '@nestjs/axios';

// import {
//   Module,
// } from '@nestjs/common';

// import {
//   JwtModule,
// } from '@nestjs/jwt';

// import {
//   MongooseModule,
// } from '@nestjs/mongoose';

// import {
//   JwtAuthGuard,
// } from '../auth/guards/jwt-auth.guard';

// import {
//   Diamond,
//   DiamondSchema,
// } from './schemas/diamond.schema';

// import {
//   InventoryController,
// } from './inventory.controller';

// import {
//   InventorySearchService,
// } from './inventory-search.service';

// import {
//   InventorySyncService,
// } from './inventory-sync.service';

// import {
//   KiraService,
// } from './kira.service';

// @Module({
//   imports: [
//     HttpModule.register({
//       timeout: 60_000,
//       maxRedirects: 3,
//     }),

//     JwtModule.register({}),

//     MongooseModule.forFeature([
//       {
//         name:
//           Diamond.name,

//         schema:
//           DiamondSchema,
//       },
//     ]),
//   ],

//   controllers: [
//     InventoryController,
//   ],

//   providers: [
//     KiraService,

//     InventorySearchService,

//     InventorySyncService,

//     JwtAuthGuard,
//   ],

//   exports: [
//     InventorySearchService,

//     InventorySyncService,
//   ],
// })
// export class InventoryModule {}


// import {
//   HttpModule,
// } from '@nestjs/axios';

// import {
//   Module,
// } from '@nestjs/common';

// import {
//   JwtModule,
// } from '@nestjs/jwt';

// import {
//   MongooseModule,
// } from '@nestjs/mongoose';

// import {
//   JwtAuthGuard,
// } from '../auth/guards/jwt-auth.guard';

// import {
//   Diamond,
//   DiamondSchema,
// } from './schemas/diamond.schema';

// import {
//   InventoryController,
// } from './inventory.controller';

// import {
//   InventorySearchService,
// } from './inventory-search.service';

// import {
//   InventorySyncService,
// } from './inventory-sync.service';

// import {
//   KiraService,
// } from './kira.service';

// import {
//   EasysoftService,
// } from './easysoft.service';

// @Module({
//   imports: [
//     HttpModule.register({
//       timeout: 60_000,
//       maxRedirects: 3,
//     }),

//     JwtModule.register({}),

//     MongooseModule.forFeature([
//       {
//         name:
//           Diamond.name,

//         schema:
//           DiamondSchema,
//       },
//     ]),
//   ],

//   controllers: [
//     InventoryController,
//   ],

//   providers: [
//     KiraService,

//     EasysoftService,

//     InventorySearchService,

//     InventorySyncService,

//     JwtAuthGuard,
//   ],

//   exports: [
//     InventorySearchService,

//     InventorySyncService,
//   ],
// })
// export class InventoryModule {}


// import {
//   HttpModule,
// } from '@nestjs/axios';

// import {
//   Module,
// } from '@nestjs/common';

// import {
//   JwtModule,
// } from '@nestjs/jwt';

// import {
//   MongooseModule,
// } from '@nestjs/mongoose';

// import {
//   JwtAuthGuard,
// } from '../auth/guards/jwt-auth.guard';

// import {
//   EASYSOFT_DB_CONNECTION,
//   KIRA_DB_CONNECTION,
// } from '../database/database.constants';

// import {
//   Diamond,
//   DiamondSchema,
// } from './schemas/diamond.schema';

// import {
//   InventoryController,
// } from './inventory.controller';

// import {
//   InventorySearchService,
// } from './inventory-search.service';

// import {
//   InventorySyncService,
// } from './inventory-sync.service';

// import {
//   KiraService,
// } from './kira.service';

// import {
//   EasysoftService,
// } from './easysoft.service';

// @Module({
//   imports: [
//     HttpModule.register({
//       timeout: 60_000,
//       maxRedirects: 3,
//     }),

//     JwtModule.register({}),

//     /*
//      * Kira diamonds
//      *
//      * Railway MongoDB
//      * database: bright_kira
//      * collection: diamonds
//      */
//     MongooseModule.forFeature(
//       [
//         {
//           name:
//             Diamond.name,

//           schema:
//             DiamondSchema,
//         },
//       ],

//       KIRA_DB_CONNECTION,
//     ),

//     /*
//      * Easysoft diamonds
//      *
//      * Railway MongoDB
//      * database: bright_easysoft
//      * collection: diamonds
//      */
//     MongooseModule.forFeature(
//       [
//         {
//           name:
//             Diamond.name,

//           schema:
//             DiamondSchema,
//         },
//       ],

//       EASYSOFT_DB_CONNECTION,
//     ),
//   ],

//   controllers: [
//     InventoryController,
//   ],

//   providers: [
//     KiraService,

//     EasysoftService,

//     InventorySearchService,

//     InventorySyncService,

//     JwtAuthGuard,
//   ],

//   exports: [
//     InventorySearchService,

//     InventorySyncService,
//   ],
// })
// export class InventoryModule {}



import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { InventoryController } from './inventory.controller';
import {  KiraService } from './kira.service';
import { InventorySearchService } from './inventory-search.service';

import {
  Diamond,
  DiamondSchema,
} from './schemas/diamond.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Diamond.name,
        schema: DiamondSchema,
      },
    ]),
  ],

  controllers: [InventoryController],

  providers: [
    KiraService,
    InventorySearchService,
  ],

  exports: [
    KiraService,
    InventorySearchService,
  ],
})
export class InventoryModule {}