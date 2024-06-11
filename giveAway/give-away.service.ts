import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import {
  Giveaway,
  GiveawayDocument,
  PaginatedGiveaway,
} from '../../database/schemas/give-away.model';
import { LoggerService } from 'src/utils/logger/logger.service';
import { MongoService } from 'src/database/mongodb/mongo/mongo.service';

@Injectable()
export class GiveawayService {
  readonly className = `GiveawayService`;
  constructor(
    @InjectModel(Giveaway.name, 'resources')
    private readonly giveawayModel: Model<GiveawayDocument>,
    private readonly loggerService: LoggerService,
    private readonly mongoService: MongoService,
  ) {}

  // to get all the luckyspins
  async getAllGiveAway(
    page: number = 1,
    pageSize: number = 10,
    searchQuery: string = '',
    category: string = '',
    type: string = '',
  ): Promise<PaginatedGiveaway> {
    const methodName = `getAllGiveAway`;
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

      const data = await this.giveawayModel
        .find()
        .find(matchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec();

      const totalCount = await this.giveawayModel.countDocuments(matchQuery);
      const totalPages = Math.ceil(totalCount / pageSize);

      const response: PaginatedGiveaway = {
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
  async getGiveAwayById(id: string): Promise<Giveaway> {
    const methodName = `getGiveAwayById`;
    try {
      let filter = {
        _id: id,
      };
      const result = await this.mongoService.findOne(
        this.giveawayModel,
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

  async createGiveAway(newGiveaway: Giveaway): Promise<Giveaway> {
    const methodName = `createGiveAway`;
    try {
      const giveaway = new this.giveawayModel(newGiveaway);
      const createdGiveaway = await this.mongoService.create(giveaway);
      return createdGiveaway;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.loggerService.error(error, this.className, methodName);
        throw Error(error);
      }
    }
  }
}
