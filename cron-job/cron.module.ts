import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from '../cron-job/cron.service';
import { CronController } from '../cron-job/cron.controller';
import { LuckySpinService } from '../luckeySpin/lucky-spin.service';
import {
  LuckySpin,
  LuckySpinSchema,
} from 'src/database/schemas/lucky-spin.model';
import { MongooseModule } from '@nestjs/mongoose';
import { LuckySpinController } from '../luckeySpin/lucky-spin.controller';
import { GiveawayController } from '../giveAway/give-away.controller';
import { GiveawayService } from '../giveAway/give-away.service';
import { LoggerService } from 'src/utils/logger/logger.service';
import { MongoService } from 'src/database/mongodb/mongo/mongo.service';
import { Wallet, WalletSchema } from 'src/database/schemas/wallet.schema';
import { Giveaway, GiveawaySchema } from 'src/database/schemas/give-away.model';

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
    ScheduleModule.forRoot(),
  ],
  controllers: [CronController, LuckySpinController, GiveawayController],
  providers: [
    CronService,
    LuckySpinService,
    GiveawayService,
    LoggerService,
    MongoService,
  ],
})
export class CronModule {}
