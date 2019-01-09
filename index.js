#!/usr/bin/env node

const shell = require('shelljs');
const path = require('path');
const fs = require('fs');

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
const ORIGIN_URL = process.env.ORIGIN_URL || 'git@github.com:devlato/fake-activity.git';
const ORIGIN_DOMAIN = process.env.ORIGIN_DOMAIN || 'github.com';
const USER_NAME = process.env.USER_NAME || 'devlato';
const USER_EMAIL = process.env.USER_EMAIL || 'github@devlato.com';

const TIME_ANNOUNCEMENT_INTERVAL_IN_MS = parseInt(process.env.TIME_ANNOUNCEMENT_INTERVAL || `${5 * MINUTE_IN_MS}`);
const MIN_COMMIT_INTERVAL_IN_MS = parseInt(process.env.MIN_COMMIT_INTERVAL || `${10 * MINUTE_IN_MS}`);
const MAX_COMMIT_INTERVAL_IN_MS = parseInt(process.env.MAX_COMMIT_INTERVAL || `${4 * HOUR_IN_MS}`);
const MORNING_HOUR = parseInt(process.env.MORNING_HOUR || '9') % HOURS_IN_DAY;
const EVENING_HOUR = parseInt(process.env.EVENING_HOUR || '19') % HOURS_IN_DAY;

const MORNING_IN_MS = HOUR_IN_MS * MORNING_HOUR - TIMEZONE_OFFSET;
const EVENING_IN_MS = HOUR_IN_MS * EVENING_HOUR - TIMEZONE_OFFSET;

console.log(`
SECOND_IN_MS = ${SECOND_IN_MS}ms
SECONDS_IN_MINUTE = ${SECONDS_IN_MINUTE}

MINUTE_IN_MS = ${MINUTE_IN_MS}ms
MINUTES_IN_HOUR = ${MINUTES_IN_HOUR}

HOUR_IN_MS = ${HOUR_IN_MS}ms
HOURS_IN_DAY = ${HOURS_IN_DAY}

DAY_IN_MS = ${DAY_IN_MS}ms

TIMEZONE_OFFSET = ${TIMEZONE_OFFSET}ms (or ${TIMEZONE_OFFSET / MINUTE_IN_MS}min)

PROJECT_ROOT = ${PROJECT_ROOT}
ORIGIN_ALIAS = ${ORIGIN_ALIAS}
ORIGIN_BRANCH = ${ORIGIN_BRANCH}
ORIGIN_URL = ${ORIGIN_URL}
ORIGIN_DOMAIN = ${ORIGIN_DOMAIN}
USER_NAME = ${USER_NAME}
USER_EMAIL = ${USER_EMAIL}

TIME_ANNOUNCEMENT_INTERVAL_IN_MS = ${TIME_ANNOUNCEMENT_INTERVAL_IN_MS}ms
MIN_COMMIT_INTERVAL_IN_MS = ${MIN_COMMIT_INTERVAL_IN_MS}ms

MORNING_HOUR = ${MORNING_HOUR}
EVENING_HOUR = ${EVENING_HOUR}

MORNING_IN_MS = ${MORNING_IN_MS}ms (or ${new Date(MORNING_IN_MS)})
EVENING_IN_MS = ${EVENING_IN_MS}ms (or ${new Date(EVENING_IN_MS)})
`);

const getRandomUInt = (start = 0, end = Infinity) => Math.floor(Math.random() * (end - start) + start);

const getRandomString = (length = 255) => {
  const result = [];

  for (let i = 0; i < length; i++) {
     result.push(String.fromCharCode(getRandomUInt('a'.charCodeAt(0), 'z'.charCodeAt(0))));
  }

  return result.join('');
};

const gitInit = () => {
  console.log(`(Re)initializing repo (${ORIGIN_URL}) in "${PROJECT_ROOT}"...`);
  shell.mkdir('-p', PROJECT_ROOT);
  shell.cd(PROJECT_ROOT);
  shell.exec('git init');
  shell.exec(`git config user.name "${USER_NAME}"`);
  shell.exec(`git config user.email "${USER_EMAIL}"`);
  if (shell.exec(`git remote show ${ORIGIN_ALIAS}`).code !== 0) {
    shell.exec(`ssh-keyscan ${ORIGIN_DOMAIN} >> ~/.ssh/known_hosts`);
    shell.exec(`git remote add ${ORIGIN_ALIAS} "${ORIGIN_URL}"`);
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
  console.log(`Pushing changes to the remote repo (${ORIGIN_ALIAS}/${ORIGIN_BRANCH})...`);
  shell.exec(`git push ${ORIGIN_ALIAS} ${ORIGIN_BRANCH}`);
};

const generateRandomCommitData = () => getRandomString();

const generateRandomCommitMessage = () => `fake shit: ${getRandomString()}`;

const generateRandomFileName = () => path.resolve(PROJECT_ROOT, `./${getRandomString()}`);

const gitCommit = () => generateCommit(generateRandomFileName(), generateRandomCommitData(), generateRandomCommitMessage());

const scheduleRepetitiveInterval = (fn, intervalStrategy, listener) => {
  let timer = null;

  const interval = intervalStrategy();
  const renderTimer = () => {
    timer = setTimeout(() => {
      clearTimeout(timer);
      fn();
      renderTimer();
    }, interval);
  };

  listener(interval);

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

  if (maxInterval > MAX_COMMIT_INTERVAL_IN_MS) {
    maxInterval = MAX_COMMIT_INTERVAL_IN_MS;
  }
  
  console.log(`Generating waiting interval with [min; max) = (${minInterval}; ${maxInterval})`);
  return getRandomUInt(minInterval, maxInterval);
};

const commitListener = (interval) => {
  console.log(`Next commit is going to be done at ${new Date(Date.now() + interval).toLocaleString()}`);
};

const pushListener = (interval) => {
  console.log(`Next push is going to be done at ${new Date(Date.now() + interval).toLocaleString()}`);
};

const scheduleCommits = scheduleRepetitiveInterval(gitCommit, generateOnSpareTime, commitListener);
const schedulePushes = scheduleRepetitiveInterval(gitPush, generateOnSpareTime, pushListener);

const announceTime = () => {
  console.log(`Current time is ${new Date().toLocaleString()}`);
};

const scheduleTimeAnnouncements = () => {
  setInterval(announceTime, TIME_ANNOUNCEMENT_INTERVAL_IN_MS);

  announceTime();
};

const run = () => {
  gitInit();

  scheduleTimeAnnouncements();
  schedulePushes();
  scheduleCommits();
};

if (require.main === module) {
  run();
}

