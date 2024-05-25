import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { CreatePullRequestDto } from './pull-request.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PullRequest } from './schemas/pull-request.schema';

@Injectable()
export class PullRequestsService {
  constructor(
    @InjectModel(PullRequest.name)
    private pullRequestModel: Model<PullRequest>,
  ) {}

  async create(pullRequestBody: CreatePullRequestDto) {
    const createdPullRequest = new this.pullRequestModel(pullRequestBody);
    return await createdPullRequest.save();
  }

  async findAll() {
    return this.pullRequestModel.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} pullRequest`;
  }

  update(id: number) {
    return `This action updates a #${id} pullRequest`;
  }

  remove(id: number) {
    return `This action removes a #${id} pullRequest`;
  }
}
