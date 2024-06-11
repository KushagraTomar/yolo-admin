// src/giveaway/models/giveaway.model.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { LuckySpin, LuckySpinSchema } from './lucky-spin.model';

export type GiveawayDocument = Document & Giveaway;

@Schema()
export class Giveaway {
  @Prop({ required: true })
  brandName: string;

  @Prop({ required: true })
  giveAwayTitle: string;

  @Prop({ required: true })
  bannerImageUrl: string;

  @Prop({ required: true })
  innerBannerImageUrl: string;

  @Prop({ default: 1 })
  numberOfWinners: number;

  @Prop({ required: true })
  costPerSpin: number;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true, default: new Date() })
  startDate: Date;

  @Prop({ required: true })
  expiryDate: Date;
}

export const GiveawaySchema = SchemaFactory.createForClass(Giveaway);

export interface PaginatedGiveaway {
  data: Giveaway[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}
