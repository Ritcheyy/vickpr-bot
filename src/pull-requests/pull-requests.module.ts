import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GitlabService } from './integrations/gitlab.service';
import { PullRequestsController } from './pull-requests.controller';
import { PullRequestsService } from './pull-requests.service';
import { PullRequest, PullRequestSchema } from './schemas/pull-request.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: PullRequest.name, schema: PullRequestSchema }])],
  controllers: [PullRequestsController],
  providers: [PullRequestsService, GitlabService],
})
export class PullRequestsModule {}
