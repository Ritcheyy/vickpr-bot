export enum PullRequestStatus {
  PENDING = 'pending',
  COMMENTED = 'commented',
  REVIEWING = 'reviewing',
  APPROVED = 'approved',
  MERGED = 'merged',
  DECLINED = 'declined',
  ON_HOLD = 'on hold',
}

export enum PendingPullRequestStatus {
  PENDING = 'pending',
  COMMENTED = 'commented',
  REVIEWING = 'reviewing',
}

export enum ReviewStatusResponse {
  NOT_A_REVIEWER = 'NOT_A_REVIEWER',
  NOT_THE_MERGER = 'NOT_THE_MERGER',
  SUCCESS = 'SUCCESS',
}

export enum NotificationDispatchTypes {
  ALL_APPROVED = 'ALL_APPROVED',
  NEW_COMMENT = 'NEW_COMMENT',
  DECLINED = 'DECLINED',
  MERGED = 'MERGED',
  NONE = 'NONE',
}

export enum ReminderDispatchTypes {
  MERGER = 'MERGER',
  REVIEWERS = 'REVIEWERS',
  AUTHOR = 'AUTHOR',
}

export enum FancyPrType {
  feature = 'Feature :sparkles:',
  bugfix = 'Bugfix :bug:',
  hotfix = 'Hotfix :fire:',
  doc = 'Doc :memo:',
  deployment = 'Deployment :rocket:',
  refactor = 'Refactor :hammer:',
  style = 'Style :lipstick:',
  chore = 'Chore :wrench:',
  perf = 'Perf :zap:',
  test = 'Test :white_check_mark:',
  build = 'Build :hammer_and_wrench:',
  ci = 'CI :construction_worker:',
  revert = 'Revert :rewind:',
}
