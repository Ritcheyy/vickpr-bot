import { Controller, Get, Post, Body, Put, Param } from '@nestjs/common';
import { PullRequestsService } from './pull-requests.service';
import { CreatePullRequestDto, UpdatePullRequestDto } from './pull-request.dto';

@Controller('pull-requests')
export class PullRequestsController {
  constructor(private readonly pullRequestsService: PullRequestsService) {}

  @Post()
  create(@Body() body: CreatePullRequestDto) {
    return this.pullRequestsService.create(body);
  }

  @Get()
  findAll() {
    return this.pullRequestsService.findAll();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdatePullRequestDto) {
    return this.pullRequestsService.update(id, body);
  }
}
