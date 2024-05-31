import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ReviewerType } from '@/common/types';

export type PullRequestDocument = HydratedDocument<PullRequest>;

@Schema()
export class PullRequest {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  link: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true, default: 'pending' })
  status: string;

  @Prop({ required: true })
  project: string;

  @Prop({ required: true })
  priority: string;

  @Prop({ required: true })
  ticket: string;

  @Prop({ required: true })
  merger: string;

  @Prop({ required: true })
  author: string;

  @Prop({ type: [Object], required: true })
  reviewers: ReviewerType[];

  @Prop({ type: Object, default: null })
  message?: {
    timestamp: string;
  };
}

export const PullRequestSchema = SchemaFactory.createForClass(PullRequest);

PullRequestSchema.set('versionKey', false);

PullRequestSchema.set('timestamps', true);

PullRequestSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret = {
      id: ret._id,
      ...ret,
    };
    delete ret._id;
    return ret;
  },
});
