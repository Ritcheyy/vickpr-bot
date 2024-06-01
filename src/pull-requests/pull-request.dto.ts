import { IsArray, IsEnum, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { PullRequestStatus } from '@/common/constants';

enum PullRequestPriorityType {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  URGENT = 'urgent',
}

export class CreatePullRequestDto {
  @IsString()
  @IsNotEmpty()
  project: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUrl({ require_protocol: true }, { message: 'PR link must be a valid URL' })
  @IsNotEmpty()
  link: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(PullRequestPriorityType)
  priority: string;

  @IsUrl({ require_protocol: true }, { message: 'Ticket link must be a valid URL' })
  @IsNotEmpty()
  ticket: string;

  @IsString()
  @IsNotEmpty()
  merger: string;

  @IsArray()
  @IsNotEmpty()
  reviewers: string[] | Record<string, any>[];
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
  @IsUrl({ require_protocol: true }, { message: 'PR link must be a valid URL' })
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
  @IsUrl({ require_protocol: true }, { message: 'Ticket link must be a valid URL' })
  readonly ticket: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(PullRequestStatus)
  readonly status: string;

  @IsString()
  @IsNotEmpty()
  readonly merger: string;

  @IsArray()
  @IsNotEmpty()
  reviewers: object[];
}
