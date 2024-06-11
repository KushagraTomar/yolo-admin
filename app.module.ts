/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './api/admin/admin.module';
import { ScopeValidationMiddleware } from './middleware/scopeValidation.middleware';
import { AdminController } from './api/admin/admin.controller';
import { MongoService } from './database/mongodb/mongo/mongo.service';
import { LoggerModule } from './utils/logger/logger.module';
import { DealsModule } from './api/deals/deals.module';
import { UserModule } from './api/user/user.module';
import { TaskModule } from './api/task/task.module';
import { ResourcesModule } from './utils/resources/resources.module';
import { MembershipModule } from './api/membership/membership.module';
import { CareerModule } from './api/career/career.module';
import { DealsController } from './api/deals/deals.controller';
import { superAdminValidationMiddleware } from './middleware/superAdminValidation.middleware';
import { JwtService } from '@nestjs/jwt';
import { ReportModule } from './api/report/report.module';
import { adminValidationMiddleware } from './middleware/adminValidation.middleware';
import { agentValidationMiddleware } from './middleware/agentValidation.middleware';
import { TaskController } from './api/task/task.controller';
import { ReportController } from './api/report/report.controller';
import { FilesModule } from './api/file/file.module';
import { CashbackModule } from './api/couponsAndCashback/cashback.module';
import { AuthModule } from './token-management/auth/auth.module';
import { LuckySpinModule } from './api/luckeySpin/lucky-spin.module';
import { Card91Module } from './utils/card91/card91.module';
import { GiveawayModule } from './api/giveAway/give-away.module';
import { CronModule } from './api/cron-job/cron.module';
// import { RedisModule } from './database/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      'mongodb+srv://new_user_1:new_user_1@cluster0.k7wenfl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      {
        connectionName: 'identity',
      },
    ),
    MongooseModule.forRoot(
      'mongodb+srv://new_user_1:new_user_1@cluster0.k7wenfl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      {
        connectionName: 'resources',
      },
    ),
    MongooseModule.forRoot(
      'mongodb+srv://new_user_1:new_user_1@cluster0.k7wenfl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      {
        connectionName: 'pay',
      },
    ),
    CronModule,
    AdminModule,
    LoggerModule,
    DealsModule,
    UserModule,
    TaskModule,
    ResourcesModule,
    MembershipModule,
    CareerModule,
    ReportModule,
    FilesModule,
    CashbackModule,
    AuthModule,
    LuckySpinModule,
    GiveawayModule,
    Card91Module,
    // RedisModule
  ],
  controllers: [AppController],
  providers: [AppService, MongoService, JwtService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ScopeValidationMiddleware).forRoutes('*');

    consumer.apply(superAdminValidationMiddleware).forRoutes(ReportController);

    consumer.apply(adminValidationMiddleware).forRoutes(DealsController);

    consumer.apply(agentValidationMiddleware).forRoutes(TaskController);
  }
}
