import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PullRequestsService } from './pull-requests.service';
import { CreatePullRequestDto } from './pull-request.dto';

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pullRequestsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.pullRequestsService.update(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pullRequestsService.remove(+id);
  }
}
