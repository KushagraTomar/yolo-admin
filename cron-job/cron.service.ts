import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  LuckySpin,
  LuckySpinDocument,
} from '../../database/schemas/lucky-spin.model';
import { LuckySpinService } from '../luckeySpin/lucky-spin.service';
import { MongoService } from 'src/database/mongodb/mongo/mongo.service';
import { Wallet, WalletDocument } from 'src/database/schemas/wallet.schema';
import {
  Giveaway,
  GiveawayDocument,
} from 'src/database/schemas/give-away.model';

@Injectable()
export class CronService {
  constructor(
    @InjectModel(LuckySpin.name, 'resources') // Injecting the LuckySpin model from Mongoose
    private readonly luckySpinModel: Model<LuckySpinDocument>,
    private readonly luckySpinService: LuckySpinService,
    private readonly mongoService: MongoService,

    @InjectModel(Wallet.name, 'resources')
    private readonly walletModel: Model<WalletDocument>,

    @InjectModel(Giveaway.name, 'resources')
    private readonly giveAwayModel: Model<GiveawayDocument>,
  ) {}

  // Cron Job to run updateWinnerTickets for all
  // luckyspin of a GiveAway event
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // change the time period as per requirements
  async updateAllLuckySpinWinnerTickets(): Promise<void> {
    try {
      // Fetch all LuckySpins or apply specific conditions as needed
      const luckySpinsToUpdate = await this.luckySpinModel.find({}).exec();

      for (const luckySpin of luckySpinsToUpdate) {
        // Call LuckySpinService method to update winner tickets
        await this.luckySpinService.updateWinnerTicketStatus(
          luckySpin.id
        );
      }
    } catch (error) {
        throw new BadRequestException('Error updating winner tickets');
    }
  }

  // Cron Job to run updateWinnerTickets for single
  // luckyspin by ID of a GiveAway event
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // change the time period as per requirements
  async updateWinnerTickets(id: string): Promise<void> {
    try {
      // Fetch all LuckySpins or apply specific conditions as needed
      const luckySpinsToUpdate = await this.luckySpinModel.findById(id).exec();

      await this.luckySpinService.updateWinnerTicketStatus(
        id
      );
    } catch (error) {
      throw new BadRequestException('Error updating winner tickets');
    }
  }
}
