import { PullRequestStatus } from './constants';

export const mapEmojiToStatus = (status: PullRequestStatus) => {
  switch (status) {
    case PullRequestStatus.REVIEWING:
      return ':hourglass_flowing_sand:';
    case PullRequestStatus.APPROVED:
    case PullRequestStatus.MERGED:
      return ':white_check_mark:';
    case PullRequestStatus.COMMENTED:
      return ':speech_balloon:';
    case PullRequestStatus.DECLINED:
      return ':x:';
    default:
      return '';
  }
};
