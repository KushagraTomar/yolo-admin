// src/giveaway/giveaway.controller.ts
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
import { GiveawayService } from './give-away.service';
import { Giveaway, PaginatedGiveaway } from '../../database/schemas/give-away.model';

@Controller('giveaway')
export class GiveawayController {
  constructor(private readonly giveawayService: GiveawayService) {}

  @Get()
  async getAllGiveAway(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('search') searchQuery: string,
    @Query('category') category: string,
    @Query('type') type: string,
  ): Promise<PaginatedGiveaway> {
    return await this.giveawayService.getAllGiveAway(
      page,
      pageSize,
      searchQuery,
      category,
      type,
    );
  }

  @Get(':id')
  async getGiveAwayById(@Param('id') id: string): Promise<Giveaway> {
    return await this.giveawayService.getGiveAwayById(id);
  }

  @Post()
  async createGiveAway(
    @Body(ValidationPipe) newGiveaway: Giveaway,
  ): Promise<Giveaway> {
    return await this.giveawayService.createGiveAway(newGiveaway);
  }
}
