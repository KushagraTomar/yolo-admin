/* eslint-disable prefer-const */
/* eslint-disable prettier/prettier */
// src/lucky-spin/lucky-spin.controller.ts
import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  LotteryTicket,
  LuckySpin,
  PaginatedLuckySpins,
  Reward,
} from 'src/database/schemas/lucky-spin.model';
import { LuckySpinService } from './lucky-spin.service';

@Controller('lucky-spin')
export class LuckySpinController {
  constructor(private readonly luckySpinService: LuckySpinService) {}

  @Get()
  async getAllLuckySpins(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('search') searchQuery: string,
    @Query('category') category: string,
    @Query('type') type: string,
  ): Promise<PaginatedLuckySpins> {
    return await this.luckySpinService.getAllLuckySpins(
      page,
      pageSize,
      searchQuery,
      category,
      type,
    );
  }

  @Get(':id')
  async getLuckySpinById(@Param('id') id: string): Promise<LuckySpin> {
    return await this.luckySpinService.getLuckySpinById(id);
  }

  @Post()
  async createLuckySpin(
    @Body(ValidationPipe) newLuckySpin: LuckySpin,
  ): Promise<LuckySpin> {
    return await this.luckySpinService.createLuckySpin(newLuckySpin);
  }

  @Put(':id')
  async updateLuckySpin(
    @Param('id') id: string,
    @Body(new ValidationPipe()) luckySpin: LuckySpin,
  ): Promise<LuckySpin> {
    return await this.luckySpinService.updateLuckySpin(id, luckySpin);
  }

  // to participate in a luckyspin by ID
  // input user_Id, luckySpin_Id
  @Post(':userId/:id/use')
  async useLuckySpin(@Param('id') id: string, @Param('userId') userId: string): Promise<Reward> {
    // let userId = '66681543d2e1f7cce0468ef1';
    return this.luckySpinService.useLuckySpin(id, userId);
  }

  @Get('user-daily-spin/:id/:userId')
  async getUserDailySpin(
    @Param('userId') userId: string,
    @Param('id') id: string,
  ): Promise<any> {
    return await this.luckySpinService.getUserDailySpin(id, userId);
  }

  @Get('user/:userId')
  async getUserLuckySpins(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('search') searchQuery: string,
    @Query('category') category: string,
  ): Promise<PaginatedLuckySpins> {
    let userId = 'test';
    return this.luckySpinService.getUserLuckySpins(
      userId,
      page,
      pageSize,
      searchQuery,
      category,
    );
  }

  @Get('active-tickets')
  async getActiveTicketsForUser(): Promise<LotteryTicket[]> {
    let userId = 'test1';
    return this.luckySpinService.getActiveTicketsForUser(userId);
  }

  // to update the status of tickets to WINNER for user to claim
  // updates the status of winning tickets to WINNER while
  // rest of the tickets are marked as BETTER_LUCK_NEXT_TIME
  // input luckySpin_Id , Winner_Ticket_Code
  @Put('update-status/:id')
  async updateWinnerTicketStatus(
    @Param('id') luckySpinId: string,
  ): Promise<string> {
    return await this.luckySpinService.updateWinnerTicketStatus(luckySpinId);
  }

  // to claim the winning ticket
  // mark the claimed winning ticket TO CLAIMED and
  // rest of the unclaimed winning tickets to NOT_CLAIMED
  // input user_Id, luckySpin_Id , Winner_Ticket_Code
  @Put('claim-ticket/:userId/:id')
  async claimWinnerTicket(
    @Param('userId') userId: string,
    @Param('id') id: string,
  ): Promise<string> {
    return await this.luckySpinService.claimWinnerTicket(userId, id);
  }

  @Get('get-luckyspin-history/:userId/:luckySpinId')
  async getUserLuckySpinHistory(
    @Param('userId') userId: string,
    @Param('luckySpinId') luckySpinId: string,
  ): Promise<any[]> {
    return await this.luckySpinService.getUserLuckySpinHistory(
      userId,
      luckySpinId,
    );
  }

  @Get('get-luckyspin-winner/:luckySpinId')
  async getUserLuckySpinWinners(
    @Param('luckySpinId') luckySpinId: string,
  ): Promise<any[]> {
    return await this.luckySpinService.getUserLuckySpinWinners(luckySpinId);
  }

  // to get the summary of the wins the use got from lucky spin
  // display No of Coins won and No of tickets Won with list of ticket-Ids
  // input user_Id, luckySpin_Id
  @Get('get-luckyspin-summary/:userId/:luckySpinId')
  async getUserLuckySpinSummary(
    @Param('userId') userId: string,
    @Param('luckySpinId') luckySpinId: string,
  ): Promise<any> {
    return await this.luckySpinService.getUserLuckySpinSummary(
      userId,
      luckySpinId,
    );
  }

  // to create random but unique ticket numbers for a luckyspin by ID
  // input luckySpin_Id , No_Of_Tickets to generate
  @Post('pre-create-lottery-tickets/:id/:numOfTickets')
  async preCreateLotteryTickets(
    @Param('id') luckySpinId: string,
    @Param('numOfTickets') numOfTickets: number,
  ): Promise<LuckySpin> {
    return await this.luckySpinService.preCreateLotteryTickets(
      luckySpinId,
      numOfTickets,
    );
  }
}
