import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PullRequestsModule } from './pull-requests/pull-requests.module';
import { SlackModule } from './slack/slack.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DB_CONNECTION_STRING),
    ScheduleModule.forRoot(),
    PullRequestsModule,
    SlackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
