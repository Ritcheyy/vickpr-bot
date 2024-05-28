import { IsArray, IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { PullRequestStatusType } from '../common/constants';

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
  @IsUrl()
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
  @IsUrl()
  readonly task: string;

  @IsString()
  @IsNotEmpty()
  readonly merger: string;

  @IsArray()
  @IsNotEmpty()
  reviewers: object[];
}

export class UpdatePullRequestDto {
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

  @IsString()
  @IsNotEmpty()
  @IsEnum(PullRequestStatusType)
  readonly status: string;

  @IsString()
  @IsNotEmpty()
  readonly merger: string;

  @IsArray()
  @IsNotEmpty()
  reviewers: object[];
}
