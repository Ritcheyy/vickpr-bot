import { Injectable } from '@nestjs/common';
import { Gitlab } from '@gitbeaker/core';
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
    try {
      // Check action type
    } catch (errors) {
      console.log(errors);
    }
  }
}
