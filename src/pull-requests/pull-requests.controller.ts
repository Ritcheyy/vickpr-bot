import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { GitlabEvents } from '@/common/constants';
import { CreatePullRequestDto, UpdatePullRequestDto } from './pull-request.dto';
import { PullRequestsService } from './pull-requests.service';
import { GitlabService } from './integrations/gitlab.service';

@Controller('pull-requests')
export class PullRequestsController {
  constructor(
    private readonly pullRequestsService: PullRequestsService,
    private readonly gitlabService: GitlabService,
  ) {}

  @Post()
  create(@Body() body: CreatePullRequestDto) {
    return this.pullRequestsService.create(body);
  }

  @Get()
  findAll() {
    return this.pullRequestsService.findAll();
  }

  @Get('pending')
  getAllPending() {
    return this.pullRequestsService.getAllPending();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdatePullRequestDto) {
    return this.pullRequestsService.update(id, body);
  }

  /*
  :::Integrations
  */
  @Post('/gitlab')
  handleGitlabWebhook(@Body() payload) {
    // Todo: Process with queue
    if (payload.object_kind === GitlabEvents.NOTE || payload.object_kind === GitlabEvents.MERGE_REQUEST) {
      return this.gitlabService.handlePullRequestEvent(payload);
    }
  }
}
