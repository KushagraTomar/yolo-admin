import {
  Controller,
  NotFoundException,
  Param,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { CronService } from '../cron-job/cron.service';

@Controller('cron-job')
export class CronController {
  constructor(private readonly cronService: CronService) {}

  // Cron Job to run updateWinnerTickets for all
  // luckyspin by ID of a GiveAway event
  @Post('all-update-winner-tickets')
  async allUpdateWinnerTickets(): Promise<void> {
    await this.cronService.updateAllLuckySpinWinnerTickets();
  }

  @Post('update-winner-tickets/:id')
  async updateWinnerTickets(@Param('id') id: string): Promise<void> {
    await this.cronService.updateWinnerTickets(id);
  }
}
