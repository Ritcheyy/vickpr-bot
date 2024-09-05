import * as moment from 'moment';
import { isValidObjectId, Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { NotificationDispatchTypes, PullRequestStatus, ReviewStatusResponse } from '@/common/constants';
import { CreatePullRequestDto, UpdatePullRequestDto } from './pull-request.dto';
import { PullRequest, PullRequestDocument } from './schemas/pull-request.schema';

@Injectable()
export class PullRequestsService {
  private DATE_LIMIT = 7; // todo: move to config
  private readonly REMINDER_COUNT_LIMIT = 4;

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

  async findById(id: string) {
    return this.pullRequestModel.findOne({ _id: id });
  }

  async findByMessageTimestamp(messageTimestamp: string) {
    return this.pullRequestModel.findOne({ 'message.timestamp': messageTimestamp });
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
      const { _id, reminder_count, reviewers, merger } = pullRequest;

      // check if user is a reviewer for the pull request
      const reviewer = reviewers.find((reviewer) => reviewer.user.id === userId);
      const isMerger = merger.id === userId;
      let updatedPullRequest: PullRequest = null;

      if (!reviewer && !isMerger) {
        return {
          status: ReviewStatusResponse.NOT_A_REVIEWER,
          data: null,
          notificationDispatchType: NotificationDispatchTypes.NONE,
          reviewer: null,
        };
      }

      if ((status === PullRequestStatus.MERGED || status === PullRequestStatus.ON_HOLD) && !isMerger) {
        return {
          status: ReviewStatusResponse.NOT_THE_MERGER,
          data: null,
          notificationDispatchType: NotificationDispatchTypes.NONE,
          reviewer: null,
        };
      }

      if (reviewer) {
        if (status === PullRequestStatus.COMMENTED || status === PullRequestStatus.REVIEWING) {
          // reset the reminder count to 2 if limit is reached
          const resetCount = reminder_count >= this.REMINDER_COUNT_LIMIT ? 2 : reminder_count - 1 || 0;

          updatedPullRequest = await this.pullRequestModel.findOneAndUpdate(
            { _id },
            {
              $set: {
                'reviewers.$[reviewer].status': status,
                reminder_count: resetCount,
              },
            },
            { arrayFilters: [{ 'reviewer.user.id': userId }], new: true, lean: true },
          );
        } else {
          updatedPullRequest = await this.pullRequestModel.findOneAndUpdate(
            { _id },
            { $set: { 'reviewers.$[reviewer].status': status } },
            { arrayFilters: [{ 'reviewer.user.id': userId }], new: true, lean: true },
          );
        }
      }

      if (isMerger) {
        if (status === PullRequestStatus.COMMENTED) {
          // reset the reminder count to 2 if limit is reached
          const resetCount = reminder_count >= this.REMINDER_COUNT_LIMIT ? 2 : reminder_count;

          updatedPullRequest = await this.pullRequestModel.findOneAndUpdate(
            { _id },
            { $set: { status, reminder_count: resetCount } },
            { new: true, lean: true },
          );
        } else {
          updatedPullRequest = await this.pullRequestModel.findOneAndUpdate(
            { _id },
            { $set: { status } },
            { new: true, lean: true },
          );
        }
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
          reviewer: reviewer?.user ?? updatedPullRequest.merger,
        };
      } else {
        throw new UnprocessableEntityException('Pull request could not be updated');
      }
    } catch (error) {
      throw error;
    }
  }

  async getAllPending() {
    const prClosedStatuses = [PullRequestStatus.MERGED, PullRequestStatus.DECLINED, PullRequestStatus.ON_HOLD];
    const formattedDateLimit = moment().subtract(this.DATE_LIMIT, 'days').format();

    // get pending pull requests that are not merged/declined/on-hold and were created within the last DATE_LIMIT days
    return this.pullRequestModel
      .find({ status: { $nin: prClosedStatuses }, createdAt: { $gte: formattedDateLimit } })
      .sort({ createdAt: -1 });
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
