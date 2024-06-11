/* eslint-disable prettier/prettier */
// src/lucky-spin/models/lucky-spin.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Giveaway } from '../schemas/give-away.model';
import { DealCategory } from './cashback-deal.model';

export enum RewardType {
  DISCOUNT = 'Discount', // some cashback deals
  LOTTERY_WIN = 'Lottery Win', // all 777 than we give the ticket to win consider
  COIN = 'Coin', // some coins
}

// export enum SpinType {
//   GIVEAWAY = 'GIVEAWAY ',
//   SPINS = 'SPINS',
// }

@Schema()
export class Reward {
  type: RewardType;
  amount: number;
  ticketCode: string;
  probability: number; //probability property for each reward
  constructor(data: any) {
    this.type = data.rewardType ? data.rewardType : RewardType.COIN;
    this.amount = data.amount ? data.amount : 0;
    this.ticketCode = data.ticketCode ? data.ticketCode : '';
    this.probability = data.probability ? data.probability : 0;
  }
}

const RewardSchema = SchemaFactory.createForClass(Reward);

export enum TicketStatus {
  NOT_CLAIMED = 'Ticket Not Claimed',
  CLAIMED = 'Your Are Winner',
  PENDING = 'Pending Result',
  BETTER_LUCK_NEXT_TIME = 'Better Luck Next Time',
  WINNER = 'Claim The Ticket', // Winner To Be Announced
}

@Schema()
export class LotteryTicket {
  code: string;
  userId: string; // Added userId property to track the user who received the ticket
  isWinner: boolean;
  status: TicketStatus;
  createdAt: Date; // to store date & time
  constructor(data: any) {
    this.code = data.code ? data.code : '';
    this.userId = data.userId ? data.userId : '';
    this.isWinner = data.isWinner ? data.isWinner : false;
    this.status = data.status ? data.status : TicketStatus.PENDING;
    this.createdAt = data.createdAt ? data.createdAt : new Date();
  }
}

const LotteryTicketSchema = SchemaFactory.createForClass(LotteryTicket);

@Schema()
export class UsageHistoryEntry {
  userId: string;
  usageDate: Date;
  reward?: Reward;
  constructor(data: any) {
    this.userId = data.userId ? data.userId : '';
    this.usageDate = data.usageDate ? data.usageDate : new Date();
    this.reward = data.reward ? data.reward : new Reward({});
  }
}

const UsageHistoryEntrySchema = SchemaFactory.createForClass(UsageHistoryEntry);

export type LuckySpinDocument = Document & LuckySpin;

@Schema()
export class LuckySpin {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  termsAndConditions: string;

  @Prop({ required: true })
  instructions: string;

  @Prop({ required: true, default: '' })
  punchLine: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true, default: '' })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(DealCategory),
    default: DealCategory.ENTERTAINMENT,
  })
  category: DealCategory;

  @Prop({ default: 5 })
  dailySpins: number;

  @Prop({ type: [], default: [] })
  rewards: Reward[];

  // to store random 50 unique tickets
  @Prop({ type: [String], default: [] })
  preCreatedLotteryTickets: string[];

  @Prop({ type: [], default: [] })
  lotteryTickets: LotteryTicket[];

  @Prop({ type: [], default: [] })
  usageHistory: UsageHistoryEntry[];

  @Prop({ default: '' })
  winnerTicketCode: string;

  @Prop({ type: Map, of: Number, default: {} })
  userDailySpins: Map<string, number>; // Map to store user-specific daily spins

  @Prop({ default: new Date() })
  lastDailySpinsUpdate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Giveaway' })
  giveaway: Types.ObjectId; // Reference to Giveaway
}

export const LuckySpinSchema = SchemaFactory.createForClass(LuckySpin);

export interface PaginatedLuckySpins {
  data: LuckySpin[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}
