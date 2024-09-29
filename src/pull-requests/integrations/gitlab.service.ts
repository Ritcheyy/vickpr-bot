import { Injectable } from '@nestjs/common';
import { Gitlab } from '@gitbeaker/core';
import { GitlabEventActions, GitlabEvents } from '@/common/constants';
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
          // Update existing one
          const existingPullRequest = await this.fetchPR(project.id, object_attributes.iid);
          const pullRequest = {
            title: existingPullRequest.title,
            link: existingPullRequest.web_url,
          };
          console.log(pullRequest);
        }
      }
      // Check action type
    } catch (errors) {
      console.log(errors);
    }
  }
}
