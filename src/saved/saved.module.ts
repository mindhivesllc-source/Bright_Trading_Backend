import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersModule } from '../users/users.module';
import { SavedController } from './saved.controller';
import { SavedService } from './saved.service';
import {
  SavedSearch,
  SavedSearchSchema,
} from './schemas/saved-search.schema';
import {
  SavedStone,
  SavedStoneSchema,
} from './schemas/saved-stone.schema';

@Module({
  imports: [
    // The JWT secret is supplied by JwtAuthGuard during verifyAsync().
    JwtModule.register({}),
    UsersModule,
    MongooseModule.forFeature([
      { name: SavedStone.name, schema: SavedStoneSchema },
      { name: SavedSearch.name, schema: SavedSearchSchema },
    ]),
  ],
  controllers: [SavedController],
  providers: [SavedService, JwtAuthGuard, ActiveUserGuard],
  exports: [SavedService],
})
export class SavedModule {}
