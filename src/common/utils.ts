import { PullRequestStatusType } from './constants';

export const mapEmojiToStatus = (status: PullRequestStatusType) => {
  switch (status) {
    case PullRequestStatusType.REVIEWING:
      return ':hourglass_flowing_sand:';
    case PullRequestStatusType.APPROVED:
    case PullRequestStatusType.MERGED:
      return ':white_check_mark:';
    case PullRequestStatusType.COMMENTED:
      return ':speech_balloon:';
    case PullRequestStatusType.DECLINED:
      return ':x:';
    default:
      return '';
  }
};
