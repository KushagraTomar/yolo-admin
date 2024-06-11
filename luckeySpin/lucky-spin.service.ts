import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import {
  LotteryTicket,
  LuckySpin,
  LuckySpinDocument,
  PaginatedLuckySpins,
  Reward,
  RewardType,
  TicketStatus,
  UsageHistoryEntry,
} from 'src/database/schemas/lucky-spin.model';
import { Wallet, WalletDocument } from 'src/database/schemas/wallet.schema';
import { LoggerService } from 'src/utils/logger/logger.service';
import { MongoService } from 'src/database/mongodb/mongo/mongo.service';
import {
  Giveaway,
  GiveawayDocument,
} from 'src/database/schemas/give-away.model';

@Injectable()
export class LuckySpinService {
  readonly className = `LuckySpinService`;
  constructor(
    @InjectModel(LuckySpin.name, 'resources')
    private readonly luckySpinModel: Model<LuckySpinDocument>,
    private readonly loggerService: LoggerService,
    private readonly mongoService: MongoService,

    @InjectModel(Wallet.name, 'resources')
    private readonly walletModel: Model<WalletDocument>,

    @InjectModel(Giveaway.name, 'resources')
    private readonly giveAwayModel: Model<GiveawayDocument>,
  ) {}

  // to get all the luckyspins
  async getAllLuckySpins(
    page: number = 1,
    pageSize: number = 10,
    searchQuery: string = '',
    category: string = '',
    type: string = '',
  ): Promise<PaginatedLuckySpins> {
    const methodName = `getAllLuckySpins`;
    try {
      const skip = (page - 1) * pageSize;

      let matchQuery: any = {};

      if (searchQuery) {
        matchQuery.$or = [
          { code: { $regex: new RegExp(searchQuery, 'i') } },
          // Add more fields for search as needed
        ];
      }

      if (category) {
        if (matchQuery.$and)
          matchQuery.$and.push({ category: { $eq: category } });
        else matchQuery.$and = [{ category: { $eq: category } }];
      }

      if (type) {
        if (matchQuery.$and)
          matchQuery.$and.push({ typeOfSpin: { $eq: type } });
        else matchQuery.$and = [{ typeOfSpin: { $eq: type } }];
      }

      const data = await this.luckySpinModel
        .find()
        .find(matchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec();

      const totalCount = await this.luckySpinModel.countDocuments(matchQuery);
      const totalPages = Math.ceil(totalCount / pageSize);

      const response: PaginatedLuckySpins = {
        data,
        totalCount,
        totalPages,
        currentPage: page,
      };

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.loggerService.error(error, this.className, methodName);
        throw new Error(error);
      }
    }
  }

  // to get a luckyspin by id
  async getLuckySpinById(id: string): Promise<LuckySpin> {
    const methodName = `getLuckySpinById`;
    try {
      let filter = {
        _id: id,
      };
      const result = await this.mongoService.findOne(
        this.luckySpinModel,
        filter,
      );
      if (!result) {
        throw new NotFoundException(
          'Could not find the specified data on this id',
        );
      }
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.loggerService.error(error, this.className, methodName);
        throw Error(error);
      }
    }
  }

  // to create a luckyspin
  async createLuckySpin(newLuckySpin: LuckySpin): Promise<LuckySpin> {
    const methodName = `createLuckySpin`;
    try {
      const luckySpin = new this.luckySpinModel(newLuckySpin);
      const createdLuckySpin = await this.mongoService.create(luckySpin);
      return createdLuckySpin;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.loggerService.error(error, this.className, methodName);
        throw Error(error);
      }
    }
  }

  // to perform update on a specific luckyspin by id
  async updateLuckySpin(id: string, luckySpin: LuckySpin): Promise<LuckySpin> {
    const methodName = `updateLuckySpin`;
    try {
      const updatedLuckySpin = await this.luckySpinModel
        .findByIdAndUpdate(id, luckySpin, { new: true })
        .exec();
      if (!updatedLuckySpin) {
        throw new NotFoundException(`Lucky Spin with ID '${id}' not found`);
      }
      return updatedLuckySpin;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.loggerService.error(error, this.className, methodName);
        throw new Error(error);
      }
    }
  }

  // to get the reward history of a user for the entire
  async getUserLuckySpinHistory(
    userId: string,
    giveawayId: string,
  ): Promise<any[]> {
    const methodName = 'getUserLuckySpinHistory';
    try {
      const luckySpins = await this.luckySpinModel
        .find({ giveaway: giveawayId })
        .exec();

      if (!luckySpins || luckySpins.length === 0) {
        throw new NotFoundException(
          `Lucky Spins with giveaway ID '${giveawayId}' not found`,
        );
      }

      this.loggerService.log(luckySpins.length, 'count', 'count');
      if (!luckySpins) {
        throw new NotFoundException(
          `Lucky Spin with ID '${giveawayId}' not found`,
        );
      }

      let combinedHistory = [];

      // Filter the usage history by user ID
      for (const luckySpin of luckySpins) {
        const userRewardHistory = luckySpin.usageHistory.filter(
          (history) => history.userId === userId,
        );

        const luckyspinWinner = luckySpin.lotteryTickets.filter(
          (lottery) => lottery.isWinner === true,
        );

        const result = luckyspinWinner.map((entry) => ({
          ...entry,
          price: luckySpin.productName,
        }));

        combinedHistory = [...combinedHistory, ...userRewardHistory, ...result];
      }

      return combinedHistory;
    } catch (error) {
      this.loggerService.error(error, this.className, methodName);
      throw new Error(error);
    }
  }

  async getUserLuckySpinWinners(luckySpinId: string): Promise<any[]> {
    const methodName = 'getUserLuckySpinHistory';
    try {
      const luckySpin = await this.luckySpinModel.findById(luckySpinId).exec();
      if (!luckySpin) {
        throw new NotFoundException(
          `Lucky Spin with ID '${luckySpinId}' not found`,
        );
      }

      const luckyspinWinner = luckySpin.lotteryTickets.filter(
        (lottery) => lottery.isWinner === true,
      );

      const result = luckyspinWinner.map((entry) => ({
        ...entry,
        price: luckySpin.productName,
      }));

      return result;
    } catch (error) {
      this.loggerService.error(error, this.className, methodName);
      throw new Error(error);
    }
  }

  // get summary of the spins performed in a luckySpin by the user
  // can only be performed after all the userDailySpins is over
  // give sum of Coins and No Of Tickets, and list of ticket Id
  async getUserLuckySpinSummary(
    userId: string,
    luckySpinId: string,
  ): Promise<any> {
    const methodName = 'getUserLuckySpinSummary';
    try {
      // fetch the LuckySpin document by its luckySpinId
      const luckySpin = await this.luckySpinModel.findById(luckySpinId).exec();

      if (!luckySpin) {
        throw new NotFoundException(
          `Lucky Spin with ID '${luckySpinId}' not found`,
        );
      }

      // Check the user's remaining daily spins
      // if it is more than zero throw BadRequestExcp
      const userDailySpins = luckySpin.userDailySpins.get(userId) || 0;
      if (userDailySpins > 0) {
        this.loggerService.error(
          `Your daily spins are still left`,
          this.className,
          methodName,
        );
        throw new NotFoundException(`Your daily spins are still left`);
      }

      // Get the current date in YYYY-MM-DD format
      const currentDate = new Date();
      const currentDateString = currentDate.toISOString().split('T')[0];

      // Filter the usageHistory for the specific userId
      const userTickets = luckySpin.usageHistory.filter((history) => {
        const historyDate = new Date(history.usageDate)
          .toISOString()
          .split('T')[0];
        return history.userId === userId && historyDate === currentDateString;
      });

      // Aggregate the total coins and total tickets
      let totalCoins = 0;
      const ticketNumbers: string[] = [];
      for (const ticket of userTickets) {
        if (ticket.reward.type === 'Coin') {
          totalCoins += ticket.reward.amount;
        } else if (ticket.reward.type === 'Lottery Win') {
          ticketNumbers.push(ticket.reward.ticketCode);
        }
      }

      // Generate the summary
      const summary = {
        userId,
        luckySpinId,
        totalCoins,
        totalTickets: ticketNumbers.length,
        ticketNumbers,
      };

      return summary;
    } catch (error) {
      this.loggerService.error(error, this.className, methodName);
      throw new Error(error);
    }
  }

  // to generate 'N' nof random but unique lottery tickets
  // codes for a luckySpin by ID
  async preCreateLotteryTickets(
    luckySpinId: string,
    numOfTickets: number,
  ): Promise<LuckySpin> {
    const methodName = 'preCreateLotteryTickets';
    try {
      const objectId = new Types.ObjectId(luckySpinId);

      const luckySpin = await this.luckySpinModel.findById(objectId).exec();

      if (!luckySpin) {
        throw new NotFoundException(
          `Lucky Spin with ID '${luckySpinId}' not found`,
        );
      }

      const uniqueTickets = new Set<string>();
      while (uniqueTickets.size < numOfTickets) {
        const ticketCode = this.generateUniqueTicketCode(luckySpin);
        uniqueTickets.add(ticketCode);
      }

      luckySpin.preCreatedLotteryTickets =
        luckySpin.preCreatedLotteryTickets.concat(Array.from(uniqueTickets));

      return await luckySpin.save();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.loggerService.error(error, this.className, methodName);
        throw new Error(error);
      }
    }
  }

  private generateUniqueTicketCode(luckySpin: LuckySpin): string {
    let lotteryTicketCode = '';
    const codeLength = 12;
    do {
      while (lotteryTicketCode.length < codeLength) {
        lotteryTicketCode += Math.random()
          .toString(36)
          .substring(2, 14)
          .toUpperCase();
      }
      // Trim the string to ensure it is exactly 12 characters long
      lotteryTicketCode = lotteryTicketCode.substring(0, codeLength);
    } while (
      luckySpin.preCreatedLotteryTickets.some(
        (ticket) => ticket === lotteryTicketCode,
      )
    );
    return lotteryTicketCode;
  }

  // update the status of the winning to WINNER and
  // rest of the tickets to BETTER_LUCK_NEXT_TIME
  async updateWinnerTicketStatus(
    luckySpinId: string,
    // winningTicketCode: string,
  ): Promise<string> {
    const methodName = 'updateWinnerTicketStatus';
    try {
      // Convert the luckySpinId string to an ObjectId
      // const objectId = new Types.ObjectId(luckySpinId);

      const luckySpin = await this.luckySpinModel.findById(luckySpinId).exec();

      const randomIndex = Math.floor(
        Math.random() * luckySpin.preCreatedLotteryTickets.length,
      );
      this.loggerService.log(randomIndex, 'randomIndex', methodName);
      const winnerTicketCode = luckySpin.preCreatedLotteryTickets[randomIndex];
      this.loggerService.log(winnerTicketCode, 'winningTicketCode', methodName);

      luckySpin.winnerTicketCode = winnerTicketCode;
      luckySpin.save();

      // Update the status of the winning ticket
      const updateWinnerResult = await this.luckySpinModel.updateMany(
        { _id: luckySpinId, 'lotteryTickets.code': winnerTicketCode },
        { $set: { 'lotteryTickets.$[elem].status': TicketStatus.WINNER } },
        { arrayFilters: [{ 'elem.code': winnerTicketCode }] },
      );

      // if (updateWinnerResult.matchedCount === 0) {
      //   throw new NotFoundException(
      //     `Lucky Spin with ID '${luckySpinId}' not found`,
      //   );
      // }

      // Update the status of the non-winning tickets
      await this.luckySpinModel.updateMany(
        { _id: luckySpinId },
        {
          $set: {
            'lotteryTickets.$[elem].status': TicketStatus.BETTER_LUCK_NEXT_TIME,
          },
        },
        {
          arrayFilters: [{ 'elem.code': { $ne: winnerTicketCode } }],
        },
      );
      return `Winner ticket status updated successfully`;
    } catch (error) {
      this.loggerService.error(error, this.constructor.name, methodName);
      throw new Error(error);
    }
  }

  // to allow a user to CLAIM the winner ticket and set NOT_CLAIMED
  // for those winner tickets not claimed the user first
  async claimWinnerTicket(
    userId: string,
    luckySpinId: string,
  ): Promise<string> {
    const methodName = 'claimWinnerTicketByCode';
    try {
      // Convert the luckySpinId string to an ObjectId
      const objectId = new Types.ObjectId(luckySpinId);

      const luckySpin = await this.luckySpinModel.findById(luckySpinId).exec();

      const winnerTicketCode = luckySpin.winnerTicketCode;

      // Update the status of the winning ticket and set isWinner to true
      const updateWinnerResult = await this.luckySpinModel.updateOne(
        {
          _id: objectId,
          'lotteryTickets.code': winnerTicketCode,
          'lotteryTickets.userId': userId,
          'lotteryTickets.status': TicketStatus.WINNER,
        },
        {
          $set: {
            'lotteryTickets.$.status': TicketStatus.CLAIMED,
            'lotteryTickets.$.isWinner': true,
          },
        },
      );

      if (updateWinnerResult.matchedCount === 0) {
        throw new NotFoundException(
          `No winning ticket found with code '${winnerTicketCode}' for user with ID '${userId}' in Lucky Spin with ID '${luckySpinId}'`,
        );
      }

      // Update the status of the non-claimed winning tickets
      await this.luckySpinModel.updateMany(
        {
          _id: objectId,
          'lotteryTickets.code': winnerTicketCode,
          'lotteryTickets.status': TicketStatus.WINNER,
        },
        {
          $set: { 'lotteryTickets.$[elem].status': TicketStatus.NOT_CLAIMED },
        },
        {
          arrayFilters: [
            { 'elem.code': winnerTicketCode, 'elem.userId': { $ne: userId } },
          ],
        },
      );
      return `Lottery Ticket Claimed Successfully`;
    } catch (error) {
      this.loggerService.error(error, this.constructor.name, methodName);
      throw new Error(error);
    }
  }

  // to retrive amount of spin left with the user for luckyspin
  async getUserDailySpin(id: string, userId: string): Promise<any> {
    const methodName = 'getUserDailySpin';
    try {
      let luckySpin = await this.luckySpinModel.findById(id).exec();
      if (!luckySpin) {
        throw new NotFoundException(`Lucky Spin with ID '${id}' not found`);
      }
      // Check if the user has daily spins available
      let userDailySpins = luckySpin.userDailySpins.get(userId);
      if (userDailySpins === undefined) {
        // User not found in the map, create a new entry with initial daily spins value
        throw new NotFoundException(
          `User not found in the map, create a new entry with initial daily spins value`,
        );
      }
      return {
        userId: userId,
        dailySpinLeft: userDailySpins,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.loggerService.error(error, this.className, methodName);
        throw new Error(error);
      }
    }
  }

  // to participate in a luckyspin
  async useLuckySpin(id: string, userId: string): Promise<Reward> {
    const methodName = 'useLuckySpin';
    try {
      let luckySpin = await this.luckySpinModel.findById(id).exec();
      if (!luckySpin) {
        throw new NotFoundException(`Lucky Spin with ID '${id}' not found`);
      }

      // fetch user wallet by userId
      const objectId = new Types.ObjectId(userId);
      const userWallet = await this.walletModel
        .findOne({ userID: objectId })
        .exec();

      if (!userWallet) {
        throw new NotFoundException(`User wallet with ID ${userId} not found`);
      }

      // Check if the Lucky Spin is active
      if (!luckySpin.isActive) {
        throw new BadRequestException(
          'This Lucky Spin is not currently active.',
        );
      }

      const giveaway = await this.giveAwayModel
        .findById(luckySpin.giveaway)
        .exec();
      if (!giveaway) {
        throw new NotFoundException('Giveaway not found');
      }

      const costPerSpin = giveaway.costPerSpin;

      // Check if user has enough coins for the spin
      if (userWallet.pointsBalance < costPerSpin) {
        throw new BadRequestException(
          'Insufficient coins to participate in lucky spin',
        );
      }

      // Check if it's a new day
      luckySpin = await this.updateTheUserSpinsByCurrentDate(luckySpin);

      // Check if the user has daily spins available
      let userDailySpins = luckySpin.userDailySpins.get(userId);
      if (userDailySpins === undefined) {
        // User not found in the map, create a new entry with initial daily spins value
        userDailySpins = luckySpin.dailySpins;
        luckySpin.userDailySpins.set(userId, userDailySpins);
      }

      if (userDailySpins <= 0) {
        throw new BadRequestException('You have used all your daily spins.');
      }

      // Decrement the user's daily spins count
      luckySpin.userDailySpins.set(userId, userDailySpins - 1);

      userWallet.totalPointsBurned = userWallet.totalPointsBurned + costPerSpin;
      userWallet.pointsBalance = userWallet.pointsBalance - costPerSpin;

      // Save the updated user Wallet
      await userWallet.save();

      // Save the updated Lucky Spin
      await luckySpin.save();

      // Generate a random number to determine the reward
      // const randomNumber = Math.floor(Math.random() * 1000);
      const randomNumber = 777;

      let reward: Reward;
      // Check if the number is 777 for a Lottery Win
      if (
        randomNumber === 777
        // &&
        // Math.random() <
        //   this.getRewardProbability(luckySpin, RewardType.LOTTERY_WIN)
      ) {
        // Use a random ticket from precreated lottery tickets
        const randomTicketIndex = Math.floor(
          Math.random() * luckySpin.preCreatedLotteryTickets.length,
        );
        const lotteryTicketCode =
          luckySpin.preCreatedLotteryTickets[randomTicketIndex];

        // Add new ticket if the number of unique users
        // who have received tickets cross a threshold
        const uniqueUsersWithTickets = new Set(
          luckySpin.lotteryTickets.map((ticket) => ticket.userId),
        ).size;
        const threshold = 100; // threshold of 100 unique users
        this.loggerService.log(
          `Unique users with tickets: ${uniqueUsersWithTickets}`,
          this.className,
          methodName,
        );

        if (uniqueUsersWithTickets + 1 > threshold) {
          const objectId = new Types.ObjectId(id);
          const luckySpin = await this.luckySpinModel.findById(objectId).exec();

          if (!luckySpin) {
            throw new NotFoundException(`Lucky Spin with ID '${id}' not found`);
          }

          const uniqueTickets = new Set<string>();
          let numOfTickets = 1;
          while (uniqueTickets.size < numOfTickets) {
            const ticketCode = this.generateUniqueTicketCode(luckySpin);
            uniqueTickets.add(ticketCode);
          }

          luckySpin.preCreatedLotteryTickets =
            luckySpin.preCreatedLotteryTickets.concat(
              Array.from(uniqueTickets),
            );

          await luckySpin.save();
        }

        // const lotteryTicketCode = this.generateUniqueLotteryTicketCode(luckySpin);

        luckySpin.lotteryTickets.push(
          new LotteryTicket({
            code: lotteryTicketCode,
            userId,
            isWinner: false,
            status: TicketStatus.PENDING,
          }),
        );

        reward = new Reward({
          rewardType: RewardType.LOTTERY_WIN,
          amount: 0,
          ticketCode: lotteryTicketCode,
        }); // Amount can be 0 for Lottery Wins
      } else {
        // Determine the reward based on configured probabilities
        // else get COINS as reward
        reward = this.determineReward(luckySpin, randomNumber);

        userWallet.totalPointsEarned =
          userWallet.totalPointsEarned + reward.amount;
        userWallet.pointsBalance = userWallet.pointsBalance + reward.amount;

        // Save the updated user Wallet
        await userWallet.save();
      }

      // const rewardData = new Reward(reward);
      // Record the usage history with rewards
      luckySpin.usageHistory.push(
        new UsageHistoryEntry({
          userId: userId,
          usageDate: new Date(),
          reward: reward,
        }),
      );
      await luckySpin.save();
      return reward;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.loggerService.error(error, this.className, methodName);
        throw new Error(error);
      }
    }
  }

  // to get luckyspins for the given user id
  async getUserLuckySpins(
    userId: string,
    page: number,
    pageSize: number,
    searchQuery: string = '',
    category: string = '',
  ): Promise<PaginatedLuckySpins> {
    const methodName = `getUserLuckySpins`;
    try {
      const skip = (page - 1) * pageSize;

      let matchQuery: any = {
        'usageHistory.userId': userId, // Filter by user ID in usage history
      };

      if (searchQuery) {
        matchQuery.$or = [
          { code: { $regex: new RegExp(searchQuery, 'i') } },
          { brandName: { $regex: new RegExp(searchQuery, 'i') } },
          // Add more fields for search as needed
        ];
      }

      if (category) {
        matchQuery.$and = [{ category: { $eq: category } }];
      }

      const data = await this.luckySpinModel
        .find(matchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec();

      const totalCount = await this.luckySpinModel.countDocuments(matchQuery);
      const totalPages = Math.ceil(totalCount / pageSize);

      // Populate userDailySpins for each lucky spin
      for (const spin of data) {
        let userDailySpins = spin.userDailySpins.get(userId) || spin.dailySpins;
        spin.userDailySpins = new Map([['remaining', userDailySpins]]);
      }

      const response: PaginatedLuckySpins = {
        data,
        totalCount,
        totalPages,
        currentPage: page,
      };

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.loggerService.error(error, this.className, methodName);
        throw new Error(error);
      }
    }
  }

  // update by date
  private updateTheUserSpinsByCurrentDate(luckySpin: LuckySpin): any {
    if (!luckySpin.dailySpins) {
      luckySpin.dailySpins = 5;
    }
    const currentDate = new Date();
    const lastUpdateDate = new Date(luckySpin.lastDailySpinsUpdate);
    if (
      currentDate.getUTCFullYear() > lastUpdateDate.getUTCFullYear() ||
      currentDate.getUTCMonth() > lastUpdateDate.getUTCMonth() ||
      currentDate.getUTCDate() > lastUpdateDate.getUTCDate()
    ) {
      // It's a new day, reset the daily spins for the user
      luckySpin.lastDailySpinsUpdate = currentDate; // Update the last update date
      luckySpin.userDailySpins = new Map();
    }
    return luckySpin;
  }

  private generateUniqueLotteryTicketCode(luckySpin: LuckySpin): string {
    let lotteryTicketCode = '';

    do {
      // Generate a random ticket code
      lotteryTicketCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
    } while (
      luckySpin.lotteryTickets.some(
        (ticket) => ticket.code === lotteryTicketCode,
      )
    );

    return lotteryTicketCode;
  }

  private getRewardProbability(
    luckySpin: LuckySpin,
    rewardType: RewardType,
  ): number {
    const rewardConfig = luckySpin.rewards.find((r) => r.type === rewardType);
    return rewardConfig ? rewardConfig.probability : 0;
  }

  private determineReward(luckySpin: LuckySpin, randomNumber: number): Reward {
    const totalProbability = luckySpin.rewards.reduce(
      (sum, reward) => sum + reward.probability,
      0,
    );
    const randomProbability = Math.random() * totalProbability;

    let cumulativeProbability = 0;
    for (const reward of luckySpin.rewards) {
      cumulativeProbability += reward.probability;
      let amount =
        reward.type === RewardType.LOTTERY_WIN
          ? 0
          : reward.amount * Math.floor(Math.random() * 11);
      if (randomProbability < cumulativeProbability) {
        return new Reward({
          rewardType: reward.type,
          amount: amount,
          probability: randomProbability,
        });
      }
    }
    // Default reward if no specific reward is selected
    return new Reward({
      rewardType: RewardType.COIN,
      amount: Math.floor(Math.random() * 11),
      probability: randomProbability,
    });
  }

  // // for the winning reward logic for giveaways
  // async selectGiveawayWinners(): Promise<void> {
  //   const methodName = 'selectGiveawayWinners';
  //   try {
  //     const currentDate = new Date();
  //     const giveawaySpins = await this.luckySpinModel
  //       .find({
  //         isActive: true,
  //         type: SpinType.GIVEAWAY,
  //         expiryDate: { $lte: currentDate },
  //       })
  //       .exec();

  //     // Iterate over each giveaway spin and select winners
  //     for (const giveawaySpin of giveawaySpins) {
  //       const numberOfWinners = giveawaySpin.numberOfWinners || 1;

  //       // Retrieve all lottery tickets for the giveaway spin
  //       const lotteryTickets = giveawaySpin.lotteryTickets || [];

  //       // Shuffle the array of lottery tickets using the utility function
  //       const shuffledTickets = this.shuffleArray(lotteryTickets);

  //       // Select the first 'numberOfWinners' tickets as winners
  //       const winners = shuffledTickets.slice(0, numberOfWinners);

  //       // Update the status of winning tickets and inform users
  //       for (const winner of winners) {
  //         winner.isWinner = true;
  //         // Notify the user about winning the giveaway (you can implement this logic)
  //         //TO DO
  //       }
  //       // Update the giveaway spin with the modified lotteryTickets
  //       await this.luckySpinModel
  //         .findByIdAndUpdate(giveawaySpin._id, {
  //           lotteryTickets: shuffledTickets,
  //         })
  //         .exec();
  //     }
  //   } catch (error) {
  //     if (error instanceof HttpException) {
  //       throw error;
  //     } else {
  //       this.loggerService.error(error, this.className, methodName);
  //       throw Error(error);
  //     }
  //   }
  // }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }
    return shuffledArray;
  }

  async getActiveTicketsForUser(userId: string): Promise<LotteryTicket[]> {
    try {
      // Find all active giveaway spins
      const activeGiveawaySpins = await this.luckySpinModel
        .find({
          isActive: true,
          expiryDate: { $gt: new Date() }, // Check if the spin is not expired
        })
        .exec();

      const activeTickets: LotteryTicket[] = [];

      // Iterate over each active giveaway spin
      for (const giveawaySpin of activeGiveawaySpins) {
        // Retrieve all lottery tickets for the user in the current spin
        const userTickets = giveawaySpin.lotteryTickets.filter(
          (ticket) => ticket.userId === userId,
        );

        // Update the status of each ticket based on its properties
        userTickets.forEach((ticket) => {
          if (ticket.status != TicketStatus.PENDING) {
            if (ticket.isWinner) {
              ticket.status = TicketStatus.WINNER;
            } else {
              ticket.status = TicketStatus.BETTER_LUCK_NEXT_TIME;
            }
          }
          activeTickets.push(ticket);
        });
      }

      return activeTickets;
    } catch (error) {
      // Handle errors
      throw new Error(error);
    }
  }
}
