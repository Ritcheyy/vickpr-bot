import { Module } from '@nestjs/common';
import { SlackController } from './slack.controller';
import { SlackService } from './slack.service';
import { PullRequestsService } from '../pull-requests/pull-requests.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PullRequest, PullRequestSchema } from '../pull-requests/schemas/pull-request.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: PullRequest.name, schema: PullRequestSchema }])],
  controllers: [SlackController],
  providers: [SlackService, PullRequestsService],
})
export class SlackModule {}
