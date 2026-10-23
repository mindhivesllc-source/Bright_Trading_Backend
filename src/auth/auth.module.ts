// import { Module } from '@nestjs/common';
// import { JwtModule } from '@nestjs/jwt';

// import { env } from '../config/env.config';
// import { UsersModule } from '../users/users.module';
// import { AuthController } from './auth.controller';
// import { AuthService } from './auth.service';
// import { JwtAuthGuard } from './guards/jwt-auth.guard';

// @Module({
//   imports: [
//     UsersModule,
//     JwtModule.register({
//       secret: env.jwtSecret,
//       signOptions: {
//         expiresIn: env.jwtExpiresIn,
//         issuer: env.jwtIssuer,
//         audience: env.jwtAudience,
//       },
//       verifyOptions: {
//         issuer: env.jwtIssuer,
//         audience: env.jwtAudience,
//       },
//     }),
//   ],
//   controllers: [AuthController],
//   providers: [AuthService, JwtAuthGuard],
// })
// export class AuthModule {}






import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { CartModule } from '../cart/cart.module';
import { env } from '../config/env.config';
import { DevicesModule } from '../devices/devices.module';
import { SavedModule } from '../saved/saved.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    UsersModule,
    // Needed to delete a user's data together with the account.
    CartModule,
    DevicesModule,
    SavedModule,
    JwtModule.register({
      secret: env.jwtSecret,
      signOptions: {
        expiresIn: env.jwtExpiresIn,
        issuer: env.jwtIssuer,
        audience: env.jwtAudience,
      },
      verifyOptions: {
        issuer: env.jwtIssuer,
        audience: env.jwtAudience,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
