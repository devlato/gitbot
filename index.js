#!/usr/bin/env node

const shell = require('shelljs');
const path = require('path');

const SECOND_IN_MS = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTE_IN_MS = SECOND_IN_MS * SECONDS_IN_MINUTE;
const MINUTES_IN_HOUR = 60;
const HOUR_IN_MS = MINUTE_IN_MS * MINUTES_IN_HOUR;
const HOURS_IN_DAY = 24;
const DAY_IN_MS = HOUR_IN_MS * HOURS_IN_DAY;
const TIMEZONE_OFFSET = new Date().getTimezoneOffset() * MINUTE_IN_MS;

const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, './repo');
const ORIGIN_ALIAS = process.env.ORIGIN_ALIAS || 'origin';
const ORIGIN_BRANCH = process.env.ORIGIN_BRANCH || 'master';
const ORIGIN_URL = process.env.ORIGIN_ALIAS || 'git@github.com:devlato/fake-activity.git';
const USER_NAME = process.env.USER_NAME || 'devlato';
const USER_EMAIL = process.env.USER_EMAIL || 'github@devlato.com';

const MIN_COMMIT_INTERVAL_IN_MS = parseInt(process.env.MIN_COMMIT_INTERVAL || `${10 * MINUTE_IN_MS}`);
const MORNING_HOUR = parseInt(process.env.MORNING_HOUR || '9') % HOURS_IN_DAY;
const EVENING_HOUR = parseInt(process.env.EVENING_HOUR || '19') % HOURS_IN_DAY;

const MORNING_IN_MS = HOUR_IN_MS * MORNING_HOUR - TIMEZONE_OFFSET;
const EVENING_IN_MS = HOUR_IN_MS * EVENING_HOUR - TIMEZONE_OFFSET;

const getRandomString = (length = 255) => {
  const result = [];

  for (let i = 0; i < length; i++) {
     result.push(String.fromCharCode(getRandomUInt('a'.charCodeAt(0), 'z'.charCodeAt(0))));
  }

  return result.join('');
};

const gitInit = (repoURL) => {
  console.log(`(Re)initializing repo (${repoURL}) in "${PROJECT_ROOT}"...`);
  shell.mkdir('-p', PROJECT_ROOT);
  shell.cd(PROJECT_ROOT);
  shell.exec('git init');
  shell.exec(`git config user.name "${USER_NAME}"`);
  shell.exec(`git config user.email "${USER_EMAIL}"`);
  if (shell.exec('git remote show origin').code !== 0) {
    shell.exec(`git remote add ${originAlias} "${originURL}"`);
  }
  shell.exec('git status');
};

const generateCommit = (fileName, data, commitMessage) => {
  console.log(`Generating commit in "${fileName}" with data "${data}" and message "${commitMessage}"...`);
  shell.cd(PROJECT_ROOT);
  fs.writeFileSync(fileName, data);
  shell.exec('git add .');
  shell.exec(`git commit -am "${commitMessage}"`);
};

const gitPush = () => {
  console.log(`Pushing changes to the remote repo (${originAlias}/${originBranch})...`);
  shell.exec(`git push ${originAlias} ${originBranch}`);
};

const generateRandomCommitData = () => getRandomString();

const generateRandomCommitMessage = () => `fake shit: ${getRandomString()}`;

const generateRandomFileName = () => path.resolve(PROJECT_ROOT, `./${getRandomString()}`);

const gitCommit = () => generateCommit(generateRandomFileName(), generateRandomCommitData(), generateRandomCommitMessage());

const scheduleRepetitiveInterval = (fn, intervalStrategy) => {
  let timer = null;

  const renderTimer = () => {
    timer = setTimeout(() => {
      clearTimeout(timer);
      fn();
      renderTimer();
    }, intervalStrategy());
  };

  return () => renderTimer();
};

const generateOnSpareTime = () => {
  const msSinceBeginningOfTheDay = Date.now() % DAY_IN_MS;
  let minInterval = EVENING_IN_MS - msSinceBeginningOfTheDay;
  let maxInterval = (DAY_IN_MS - msSinceBeginningOfTheDay) + MORNING_IN_MS;
  if (msSinceBeginningOfTheDay < MORNING_IN_MS) {
    minInterval = MIN_COMMIT_INTERVAL_IN_MS;
    maxInterval = MORNING_IN_MS - msSinceBeginningOfTheDay;
  } else if (msSinceBeginningOfTheDay > EVENING_IN_MS) {
    minInterval = MIN_COMMIT_INTERVAL_IN_MS;
    maxInterval = (DAY_IN_MS - msSinceBeginningOfTheDay) + MORNING_IN_MS;
  }
  
  return getRandomUInt(minInterval, maxInterval);
};

const scheduleCommits = scheduleRepetitiveInterval(gitCommit, generateOnSpareTime);
const schedulePushes = scheduleRepetitiveInterval(gitPush, generateOnSpareTime);

const run = () => {
  gitInit();

  scheduleCommits();
  schedulePushes();
};

