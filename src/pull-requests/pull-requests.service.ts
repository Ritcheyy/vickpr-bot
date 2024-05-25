import { isValidObjectId, Model } from 'mongoose';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { CreatePullRequestDto, UpdatePullRequestDto } from './pull-request.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PullRequest } from './schemas/pull-request.schema';
import { PullRequestStatusType } from '../common/constants';

@Injectable()
export class PullRequestsService {
  constructor(
    @InjectModel(PullRequest.name)
    private pullRequestModel: Model<PullRequest>,
  ) {}

  async create(pullRequestBody: CreatePullRequestDto) {
    pullRequestBody.reviewers = pullRequestBody.reviewers.map((reviewer) => ({
      user: reviewer,
      status: PullRequestStatusType.PENDING,
    }));

    const createdPullRequest = new this.pullRequestModel(pullRequestBody);
    return await createdPullRequest.save();
  }

  async findAll() {
    return this.pullRequestModel.find().sort({ createdAt: -1 });
  }

  async update(id: string, body: UpdatePullRequestDto) {
    if (!isValidObjectId(id)) {
      throw new UnprocessableEntityException('Invalid ID');
    }

    const pullRequest = await this.pullRequestModel
      .findByIdAndUpdate(id, { $set: body }, { new: true })
      .lean();

    if (!pullRequest) {
      throw new UnprocessableEntityException('Pull Request not found');
    }

    return pullRequest;
  }
}
