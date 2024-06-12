import { isValidObjectId, Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  NotificationDispatchTypes,
  PendingPullRequestStatus,
  PullRequestStatus,
  ReviewStatusResponse,
} from '@/common/constants';
import { CreatePullRequestDto, UpdatePullRequestDto } from './pull-request.dto';
import { PullRequest, PullRequestDocument } from './schemas/pull-request.schema';

@Injectable()
export class PullRequestsService {
  constructor(
    @InjectModel(PullRequest.name)
    private pullRequestModel: Model<PullRequest>,
  ) {}

  async validatePullRequestData(pullRequestBody: any) {
    try {
      // validate here, since it's not routing through http
      const newPullRequest = plainToInstance(CreatePullRequestDto, pullRequestBody);

      await validateOrReject(newPullRequest);
    } catch (error) {
      throw error;
    }
  }

  async create(pullRequestBody: CreatePullRequestDto) {
    const newPullRequest = plainToInstance(CreatePullRequestDto, pullRequestBody);

    try {
      await validateOrReject(newPullRequest);

      const createdPullRequest = new this.pullRequestModel(pullRequestBody);
      return await createdPullRequest.save();
    } catch (errors) {
      throw errors;
    }
  }

  async findAll() {
    return this.pullRequestModel.find().sort({ createdAt: -1 }).limit(20);
  }

  async findByMessageTimestamp(messageTimestamp: string) {
    return this.pullRequestModel.findOne({ message: { timestamp: messageTimestamp } });
  }

  async getAllPending() {
    const pendingStatuses = Object.values(PendingPullRequestStatus);

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

  async updateReviewStatus(pullRequest: PullRequestDocument, userId: string, status: string) {
    try {
      // check if user is a reviewer for the pull request
      const reviewer = pullRequest.reviewers.find((reviewer) => reviewer.user.id === userId);
      const isMerger = pullRequest.merger.id === userId;
      let updatedPullRequest: PullRequest = null;

      if (!reviewer && !isMerger) {
        return {
          status: ReviewStatusResponse.NOT_A_REVIEWER,
          data: null,
          notificationDispatchType: NotificationDispatchTypes.NONE,
        };
      }

      if (status === PullRequestStatus.MERGED && !isMerger) {
        return {
          status: ReviewStatusResponse.NOT_THE_MERGER,
          data: null,
          notificationDispatchType: NotificationDispatchTypes.NONE,
        };
      }

      if (reviewer) {
        updatedPullRequest = await this.pullRequestModel.findOneAndUpdate(
          { _id: pullRequest._id },
          { $set: { 'reviewers.$[reviewer].status': status } },
          { arrayFilters: [{ 'reviewer.user.id': userId }], new: true, lean: true },
        );
      }

      if (isMerger) {
        updatedPullRequest = await this.pullRequestModel.findOneAndUpdate(
          { _id: pullRequest._id },
          { $set: { status: status } },
          { new: true, lean: true },
        );
      }

      if (updatedPullRequest) {
        // check if it is the last approval needed - everyone has approved
        const hasTotalApprovals = updatedPullRequest.reviewers.every(
          (reviewer) => reviewer.status === PullRequestStatus.APPROVED,
        );

        return {
          status: ReviewStatusResponse.SUCCESS,
          data: updatedPullRequest,
          notificationDispatchType: this.getNotificationDispatchType(status, hasTotalApprovals),
        };
      } else {
        throw new UnprocessableEntityException('Pull request could not be updated');
      }
    } catch (error) {
      throw error;
    }
  }

  getNotificationDispatchType(status: string, hasTotalApprovals: boolean = false) {
    switch (status) {
      case PullRequestStatus.APPROVED:
        if (hasTotalApprovals) {
          return NotificationDispatchTypes.ALL_APPROVED;
        }
        return NotificationDispatchTypes.NONE;
      case PullRequestStatus.COMMENTED:
        return NotificationDispatchTypes.NEW_COMMENT;
      case PullRequestStatus.DECLINED:
        return NotificationDispatchTypes.DECLINED;
      case PullRequestStatus.MERGED:
        return NotificationDispatchTypes.MERGED;
      default:
        return NotificationDispatchTypes.NONE;
    }
  }
}
