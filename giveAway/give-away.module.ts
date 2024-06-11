// src/giveaway/giveaway.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GiveawayController } from './give-away.controller';
import { GiveawayService } from './give-away.service';
import {
  Giveaway,
  GiveawaySchema,
} from '../../database/schemas/give-away.model';
import { LoggerService } from 'src/utils/logger/logger.service';
import { MongoService } from 'src/database/mongodb/mongo/mongo.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Giveaway.name, schema: GiveawaySchema }],
      'resources',
    ),
  ],
  controllers: [GiveawayController],
  providers: [GiveawayService, LoggerService, MongoService],
})
export class GiveawayModule {}
