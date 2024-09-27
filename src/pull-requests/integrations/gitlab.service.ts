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
      const projects = await this.apiClient.MergeRequests.show(projectId, prId);
      console.log(projects);
      return projects;
    } catch (errors) {
      throw errors;
    }
  }

  async handlePullRequestEvent(payload) {
    const { object_kind, object_attributes } = payload;

    try {
      // Check event type
      if (object_kind === GitlabEvents.NOTE) {
      } else {
        // Merge request type
        if (object_attributes.action === GitlabEventActions.OPEN) {
          // create a new pull request
        } else {
          // Update existing one
        }
      }
      // Check action type
    } catch (errors) {
      console.log(errors);
    }
  }
}
