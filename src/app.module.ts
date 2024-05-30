import Config from '../config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PullRequestsModule } from './pull-requests/pull-requests.module';
import { ConfigModule } from '@nestjs/config';
import { SlackModule } from './slack/slack.module';

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
