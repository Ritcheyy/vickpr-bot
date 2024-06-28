import { PullRequestStatus } from '@/common/constants';
import { ReviewerType } from './types';
import { mapEmojiToStatus } from './utils';

export const _extractBlockFormValues = (submittedValues: any) => {
  const structuredValues: any = {};
  const blockIdMapping: any = {};

  Object.values(submittedValues).forEach((inputField) => {
    const field = Object.keys(inputField)[0];
    const fieldValue = Object.values(inputField)[0];
    const value =
      fieldValue.value ??
      fieldValue.selected_users ??
      fieldValue.selected_user ??
      fieldValue.selected_option?.value ??
      null;

    structuredValues[field] = value;
  });

  Object.keys(submittedValues).forEach((key) => {
    const field = Object.keys(submittedValues[key])[0];

    blockIdMapping[field] = key;
  });

  return {
    structuredValues,
    blockIdMapping,
  };
};

/*
 * get reviewers and format as string...
 * @return format - "@Ritcheyy, @John, @Deo"
 */
export const getReviewers = (reviewers: ReviewerType[]) => {
  if (reviewers.length === 0) {
    return 'No reviewers';
  }

  return reviewers.map((reviewer) => `<@${reviewer.user.id}>`).join(', ');
};

/*
 * get reviewers and format as string...
 * @return format - "@Ritcheyy ✅, @John, @Deo ❌"
 */
export const getReviewersWithStatusEmoji = (reviewers: ReviewerType[]) => {
  if (reviewers.length === 0) {
    return 'No reviewers';
  }

  return reviewers
    .map((reviewer) => `<@${reviewer.user.id}>${' ' + mapEmojiToStatus(reviewer.status as PullRequestStatus)}`)
    .join(', ');
};

/*
 * get attachment color based on status
 * @return color hex
 */
export const getAttachmentColor = (status: string) => {
  switch (status) {
    case PullRequestStatus.MERGED:
      return '#33a12f';
    case PullRequestStatus.DECLINED:
      return '#bb3638';
    default:
      return '#d4ad3b';
  }
};

/*
 * fetch user information
 * @return object
 */
export const getUserInfo = async (client: any, userId: string) => {
  try {
    const userInfoResponse = await client.users.info({ user: userId });
    if (userInfoResponse.ok) {
      return {
        id: userInfoResponse.user.id,
        name:
          userInfoResponse.user?.real_name ||
          userInfoResponse.user?.profile?.real_name ||
          userInfoResponse.user?.profile?.display_name,
        display_name: userInfoResponse.user.profile.display_name,
      };
    } else {
      throw userInfoResponse.error;
    }
  } catch (error) {
    throw error;
  }
};

/*
 * get ticket id from jira link - ex: https://jira.example.com/browse/PROJ-123
 * @return number - PROJ-123
 */
export const getTicketIdFromLink = (link: string) => {
  return link.split('/browse/').pop();
};

export const _capitalizeString = (str: string = '') => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
