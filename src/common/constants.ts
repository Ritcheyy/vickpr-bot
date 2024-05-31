export enum PullRequestStatusType {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMMENTED = 'commented',
  REVIEWING = 'reviewing',
  REJECTED = 'rejected',
  DECLINED = 'declined',
  MERGED = 'merged',
}

export enum ReviewStatusResponseType {
  NOT_A_REVIEWER = 'NOT_A_REVIEWER',
  SUCCESS = 'SUCCESS',
}

export enum PendingPullRequestStatusType {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMMENTED = 'commented',
  REVIEWING = 'reviewing',
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
