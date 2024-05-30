import { isValidObjectId, Model } from 'mongoose';
import { validateOrReject, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreatePullRequestDto, UpdatePullRequestDto } from './pull-request.dto';
import { PullRequest } from './schemas/pull-request.schema';
import { PendingPullRequestStatusType, PullRequestStatusType } from '../common/constants';

@Injectable()
export class PullRequestsService {
  constructor(
    @InjectModel(PullRequest.name)
    private pullRequestModel: Model<PullRequest>,
  ) {}

  async create(pullRequestBody: CreatePullRequestDto, blockIdMapping?: any, ack?: any) {
    const newPullRequest = plainToInstance(CreatePullRequestDto, pullRequestBody);

    try {
      // validate here, since it's not routing through http
      await validateOrReject(newPullRequest);

      // Transform reviewers data, add review status - pending
      pullRequestBody.reviewers = pullRequestBody.reviewers.map((reviewer) => ({
        user: reviewer,
        status: PullRequestStatusType.PENDING,
      }));

      const createdPullRequest = new this.pullRequestModel(pullRequestBody);
      const savedPullRequest = await createdPullRequest.save();

      // Submit PR to PR Channel

      await ack();

      return savedPullRequest;
    } catch (errors) {
      if (errors instanceof Array && errors[0] instanceof ValidationError) {
        const formattedError = errors.reduce(
          (acc, error) => ({ ...acc, [blockIdMapping[error.property]]: Object.values(error.constraints)[0] }),
          {},
        );
        ack({
          response_action: 'errors',
          errors: formattedError,
        });
      }
      throw errors;
    }
  }

  async findAll() {
    return this.pullRequestModel.find().sort({ createdAt: -1 }).limit(20);
  }

  async getAllPending() {
    const pendingStatuses = Object.values(PendingPullRequestStatusType);

    return this.pullRequestModel.find({ status: { $in: pendingStatuses } }).sort({ createdAt: -1 });
  }

  async update(id: string, body: UpdatePullRequestDto) {
    if (!isValidObjectId(id)) {
      throw new UnprocessableEntityException('Invalid ID');
    }

    const pullRequest = await this.pullRequestModel.findByIdAndUpdate(id, { $set: body }, { new: true });

    if (!pullRequest) {
      throw new UnprocessableEntityException('Pull Request not found');
    }

    return pullRequest;
  }
}
