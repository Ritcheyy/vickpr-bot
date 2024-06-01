export enum PullRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMMENTED = 'commented',
  REVIEWING = 'reviewing',
  REJECTED = 'rejected',
  DECLINED = 'declined',
  MERGED = 'merged',
}

export enum ReviewStatusResponse {
  NOT_A_REVIEWER = 'NOT_A_REVIEWER',
  NOT_THE_MERGER = 'NOT_THE_MERGER',
  SUCCESS = 'SUCCESS',
}

export enum PendingPullRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMMENTED = 'commented',
  REVIEWING = 'reviewing',
}

export enum NotificationDispatchTypes {
  ALL_APPROVED = 'ALL_APPROVED',
  NEW_COMMENT = 'NEW_COMMENT',
  DECLINED = 'DECLINED',
  MERGED = 'MERGED',
  NONE = 'NONE',
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
