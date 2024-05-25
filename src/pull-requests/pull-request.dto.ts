import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';

// type PullRequestStatusType = 'pending' | 'approved' | 'commented' | 'rejected';
enum PullRequestPriorityType {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export class CreatePullRequestDto {
  @IsString()
  @IsNotEmpty()
  readonly project: string;

  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  readonly link: string;

  @IsString()
  @IsNotEmpty()
  readonly type: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(PullRequestPriorityType)
  readonly priority: string;

  @IsString()
  @IsNotEmpty()
  readonly task: string;

  @IsArray()
  @IsNotEmpty()
  reviewers: object[];
}
