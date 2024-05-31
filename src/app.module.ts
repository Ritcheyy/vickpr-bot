import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PullRequestsModule } from './pull-requests/pull-requests.module';
import { SlackModule } from './slack/slack.module';
import Config from '../config';

@Module({
  imports: [
    PullRequestsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(Config.DB_CONNECTION_STRING),
    SlackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
