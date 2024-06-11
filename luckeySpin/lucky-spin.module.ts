/* eslint-disable prettier/prettier */
// src/lucky-spin/lucky-spin.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LuckySpinController } from './lucky-spin.controller';
import {
  LuckySpin,
  LuckySpinSchema,
} from 'src/database/schemas/lucky-spin.model';
import {
  Giveaway,
  GiveawaySchema,
} from '../../database/schemas/give-away.model';
import { GiveawayController } from '../giveAway/give-away.controller';
import { LuckySpinService } from './lucky-spin.service';
import { LoggerService } from 'src/utils/logger/logger.service';
import { MongoService } from 'src/database/mongodb/mongo/mongo.service';
import { Wallet, WalletSchema } from 'src/database/schemas/wallet.schema';
import { GiveawayService } from '../giveAway/give-away.service';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: LuckySpin.name, schema: LuckySpinSchema },
        { name: Wallet.name, schema: WalletSchema },
        { name: Giveaway.name, schema: GiveawaySchema },
      ],
      
      'resources',
    ),
  ],
  controllers: [LuckySpinController, GiveawayController],
  providers: [LuckySpinService, GiveawayService, LoggerService, MongoService],
})
export class LuckySpinModule {}
