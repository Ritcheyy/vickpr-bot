## VickPR Bot

VickPR Bot is a Semi-Automated Slack app designed to streamline pull request management within our development team.

### Tools/Technologies

VickPR Bot is built using the following tools and technologies:

- NodeJS and NestJS
- MongoDB
- Slack API
- Slack Block kit


### Getting started

```bash
$ git clone [repo-link] vickpr-bot
```

```bash
# copy config file
$ cp config/index.example.ts config/index.ts
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

1. **Installation**: Install the VickPR Bot Slack app from the Slack App Directory.

2. **Configuration**: Configure the app settings, including Slack OAuth tokens.

3. **Usage**: Use Slack slash commands to submit PR details and schedule reminders.

### Roadmap

- [x] Implement Slack slash commands for PR submission.
- [x] Set up automated reminders for reviewers.
- [x] Enhance Slack interaction with interactive messages for PR details submission.
- [ ] Add support for customizing reminder intervals.

### Contribution Guidelines

VickPR Bot welcomes contributions from the community. Here's how you can contribute:

1. **Fork the Repository**: Fork the VickPR Bot repository on GitHub.

2. **Implement Features or Fixes**: Work on new features or bug fixes in your fork.

3. **Submit Pull Requests**: Submit pull requests from your fork to the main repository for review.

4. **Follow Coding Standards**: Adhere to coding standards and guidelines used in the project.

5. **Testing**: Ensure your changes are properly tested and include relevant documentation updates.

### Support and Feedback

For support or feedback, reach out to the project maintainers or open an issue on GitHub.


### Authors

- [Ritcheyy](https://github.com/ritcheyy)