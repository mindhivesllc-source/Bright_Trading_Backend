import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersModule } from '../users/users.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart, CartSchema } from './schemas/cart.schema';

@Module({
  imports: [
    // The JWT secret is supplied by JwtAuthGuard during verifyAsync().
    JwtModule.register({}),
    UsersModule,
    MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),
  ],
  controllers: [CartController],
  providers: [CartService, JwtAuthGuard, ActiveUserGuard],
  // The model is exported for the notification scheduler.
  exports: [CartService, MongooseModule],
})
export class CartModule {}
