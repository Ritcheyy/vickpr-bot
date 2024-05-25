## VickPR Agent

VickPR Agent is a Semi-Automated Slack app designed to streamline pull request (PR) management within our development team. Its primary objectives include:

### Tools/Technologies

VickPR Agent is built using the following tools and technologies:

- NodeJS and NestJS
- MongoDB
- Slack API
- Slack Block kit


### Getting started

```bash
$ git clone repo-link vickpr-agent
```

### Installation

```bash
$ npm install
```

### Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

### Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

### Slack Installation

1. **Installation**: Install the VickPR Agent Slack app from the Slack App Directory.

2. **Configuration**: Configure the app settings, including Slack OAuth tokens.

3. **Usage**: Use Slack slash commands to submit PR details and schedule reminders.

### Roadmap

- [x] Implement Slack slash commands for PR submission.
- [x] Set up automated reminders for reviewers.
- [ ] Enhance Slack interaction with interactive messages for PR details submission.
- [ ] Add support for customizing reminder intervals.
- [ ] Integrate with GitHub API to fetch PR details automatically.
- [ ] Implement Jira integration for linking PRs to associated tasks.
- [ ] Enhance UI/UX with interactive components and improved error handling.
- [ ] Introduce support for multiple repositories and project boards.
- [ ] Implement support for other version control systems (e.g., Bitbucket, GitLab).
- [ ] Introduce advanced analytics and reporting features for PR performance tracking.

### Contribution Guidelines

VickPR Agent welcomes contributions from the community. Here's how you can contribute:

1. **Fork the Repository**: Fork the VickPR Agent repository on GitHub.

2. **Implement Features or Fixes**: Work on new features or bug fixes in your fork.

3. **Submit Pull Requests**: Submit pull requests from your fork to the main repository for review.

4. **Follow Coding Standards**: Adhere to coding standards and guidelines used in the project.

5. **Testing**: Ensure your changes are properly tested and include relevant documentation updates.

### Support and Feedback

For support or feedback, reach out to the project maintainers or open an issue on GitHub.


### Authors

- [Ritcheyy](https://github.com/ritcheyy)