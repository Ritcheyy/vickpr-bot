// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

import { Gitlab } from '@gitbeaker/rest';

if (!process.env.GITLAB_TOKEN) {
  throw new Error('Gitlab access token is missing');
}

const api = new Gitlab({
  host: process.env.GITLAB_HOST || 'https://gitlab.com',
  token: process.env.GITLAB_TOKEN || '',
});

export default api;
