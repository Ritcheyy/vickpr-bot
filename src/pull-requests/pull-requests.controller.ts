import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CreatePullRequestDto, UpdatePullRequestDto } from './pull-request.dto';
import { PullRequestsService } from './pull-requests.service';

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

  @Get('pending')
  getAllPending() {
    return this.pullRequestsService.getAllPending();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdatePullRequestDto) {
    return this.pullRequestsService.update(id, body);
  }
}
