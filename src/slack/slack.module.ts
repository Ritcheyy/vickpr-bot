import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PullRequestsService } from '@/pull-requests/pull-requests.service';
import { PullRequest, PullRequestSchema } from '@/pull-requests/schemas/pull-request.schema';
import { SlackController } from './slack.controller';
import { SlackService } from './slack.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: PullRequest.name, schema: PullRequestSchema }])],
  controllers: [SlackController],
  providers: [SlackService, PullRequestsService],
})
export class SlackModule {}
