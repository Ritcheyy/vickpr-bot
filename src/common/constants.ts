export enum PullRequestStatusType {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMMENTED = 'commented',
  'IN-REVIEW' = 'in-review',
  REJECTED = 'rejected',
  MERGED = 'merged',
}

export enum PendingPullRequestStatusType {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMMENTED = 'commented',
  'IN-REVIEW' = 'in-review',
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
