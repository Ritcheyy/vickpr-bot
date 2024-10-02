import { Injectable } from '@nestjs/common';
import { Gitlab } from '@gitbeaker/core';
import { GitlabEventActions, GitlabEvents } from '@/common/constants';
import { extractValuesFromTemplate } from '@/common/helpers';
import { PrDescriptionValues } from '@/common/types';
import GitlabClient from '../../common/integrations/gitlab';

@Injectable()
export class GitlabService {
  private readonly apiClient: Gitlab;

  constructor() {
    this.apiClient = GitlabClient;
  }

  async fetchPR(projectId: string | number, prId: number) {
    try {
      return await this.apiClient.MergeRequests.show(projectId, prId);
    } catch (errors) {
      throw errors;
    }
  }

  async handlePullRequestEvent(payload: Record<any, any>) {
    const { project, object_kind, object_attributes } = payload;

    try {
      // Check event type
      if (object_kind === GitlabEvents.NOTE) {
        // Handle pull request comment
      } else {
        // Merge request type
        if (object_attributes.action === GitlabEventActions.OPEN) {
          // get the pull request details
          // const newPullRequest = await this.fetchPR(project.id, object_attributes.iid);
          // console.log(newPullRequest);
          // create a new pull request
        } else {
          // console.log(object_attributes);
          // Update existing one
          // Todo: Move to PR Open event
          const existingPullRequest = await this.fetchPR(project.id, object_attributes.iid);
          const { title, description, web_url } = existingPullRequest;
          const { ticket, priority, type }: PrDescriptionValues = extractValuesFromTemplate(description, web_url);

          const pullRequest = {
            link: web_url,
            title,
            ticket,
            type,
            priority,
            project: project.name, // format project name properly
            status: 'pending',
          };

          // Todo: Sort author and reviewers
          console.log(pullRequest);
          // console.log(existingPullRequest);
        }
      }
      // Check action type
    } catch (errors) {
      console.log(errors);
    }
  }
}
