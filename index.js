#!/usr/bin/env node

/**
 * (c) 2019 Denis Tokarev <github@devlato.com>i
 * 
 * This code is available the MIT license with providing a link to this repository
 */

const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const os = require('os');

const SECOND_IN_MS = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTE_IN_MS = SECOND_IN_MS * SECONDS_IN_MINUTE;
const MINUTES_IN_HOUR = 60;
const HOUR_IN_MS = MINUTE_IN_MS * MINUTES_IN_HOUR;
const HOURS_IN_DAY = 24;
const DAY_IN_MS = HOUR_IN_MS * HOURS_IN_DAY;

const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, './repo');
const ORIGIN_ALIAS = process.env.ORIGIN_ALIAS || 'origin';
const ORIGIN_BRANCH = process.env.ORIGIN_BRANCH || 'master';
const ORIGIN_URL = process.env.ORIGIN_URL;
const ORIGIN_DOMAIN = process.env.ORIGIN_DOMAIN || 'github.com';
const USER_NAME = process.env.USER_NAME;
const USER_EMAIL = process.env.USER_EMAIL;

const TIMEZONE_OFFSET_IN_MS = parseInt(process.env.TIMEZONE_OFFSET || `${new Date().getTimezoneOffset() * MINUTE_IN_MS}`);
const TIME_ANNOUNCEMENT_INTERVAL_IN_MS = parseInt(process.env.TIME_ANNOUNCEMENT_INTERVAL || `${5 * MINUTE_IN_MS}`);
const MIN_COMMIT_INTERVAL_IN_MS = parseInt(process.env.MIN_COMMIT_INTERVAL || `${10 * MINUTE_IN_MS}`);
const MAX_COMMIT_INTERVAL_IN_MS = parseInt(process.env.MAX_COMMIT_INTERVAL || `${4 * HOUR_IN_MS}`);
const MORNING_HOUR = parseInt(process.env.MORNING_HOUR || '9') % HOURS_IN_DAY;
const EVENING_HOUR = parseInt(process.env.EVENING_HOUR || '19') % HOURS_IN_DAY;

const MORNING_IN_MS = HOUR_IN_MS * MORNING_HOUR;
const EVENING_IN_MS = HOUR_IN_MS * EVENING_HOUR;

const ERROR_CODE_UNKNOWN = 1;
const ERROR_CODE_INVALID_PARAMETERS = 2;

const getDateWithTZ = (date = new Date()) => new Date((date && +date || 0) + TIMEZONE_OFFSET_IN_MS);
const getLocalDate = (date = new Date()) => getDateWithTZ(date).toLocaleString();
const getLocalTime = (date = new Date()) => getLocalDate(date).replace(/[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}\s+/gi, '');
const getDate = (date = new Date()) => new Date(date && +date || 0).toLocaleString();
const getTime = (date = new Date()) => getDate(date).replace(/[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}\s+/gi, '');

const log = (type, level = 'log') => (...args) => console[level](args.map((arg) => `[${type}][${getLocalDate()} local / ${getDate()} server] ${arg}`).join(os.EOL));
const logSettings = log('settings');
const logGit = log('git');
const logCommit = log('git commit');
const logPush = log('git push');
const logError = log('error', 'error');
const logInit = log('init');

const exit = (...messages) => (code = ERROR_CODE_UNKNOWN) => {
  logError(...messages);
  process.exit(code);

  return;
};

const validate = () => {
  logInit('Validating parameters');

  const errors = [];

  if (!ORIGIN_URL) {
    errors.push('ORIGIN_URL - SSH URL of the private repo to push all the fake commits');
  }

  if (!USER_NAME) {
    errors.push('USER_NAME  - git user name');
  }

  if (!USER_EMAIL) {
    errors.push('USER_EMAIL - git user email');
  }

  if (errors.length > 0) {
    exit('Error: please specify the environment variables listed below', ...errors)(ERROR_CODE_INVALID_PARAMETERS);
  }
};

const printSettings = () => logSettings(...[
  `SECOND_IN_MS = ${SECOND_IN_MS} ms`,
  `SECONDS_IN_MINUTE = ${SECONDS_IN_MINUTE} s`,
  `MINUTE_IN_MS = ${MINUTE_IN_MS} ms`,
  `MINUTES_IN_HOUR = ${MINUTES_IN_HOUR} min`,
  `HOUR_IN_MS = ${HOUR_IN_MS} ms`,
  `HOURS_IN_DAY = ${HOURS_IN_DAY} h`,
  `DAY_IN_MS = ${DAY_IN_MS} ms`,
  `PROJECT_ROOT = ${PROJECT_ROOT}`,
  `ORIGIN_ALIAS = ${ORIGIN_ALIAS}`,
  `ORIGIN_BRANCH = ${ORIGIN_BRANCH}`,
  `ORIGIN_URL = ${ORIGIN_URL}`,
  `ORIGIN_DOMAIN = ${ORIGIN_DOMAIN}`,
  `USER_NAME = ${USER_NAME}`,
  `USER_EMAIL = ${USER_EMAIL}`,
  `TIMEZONE_OFFSET_IN_MS = ${TIMEZONE_OFFSET_IN_MS} ms (${getTime(TIMEZONE_OFFSET_IN_MS)})`,
  `TIME_ANNOUNCEMENT_INTERVAL_IN_MS = ${TIME_ANNOUNCEMENT_INTERVAL_IN_MS} ms (${getTime(TIME_ANNOUNCEMENT_INTERVAL_IN_MS)})`,
  `MIN_COMMIT_INTERVAL_IN_MS = ${MIN_COMMIT_INTERVAL_IN_MS} ms (${getTime(MIN_COMMIT_INTERVAL_IN_MS)})`,
  `MAX_COMMIT_INTERVAL_IN_MS = ${MAX_COMMIT_INTERVAL_IN_MS} ms (${getTime(MAX_COMMIT_INTERVAL_IN_MS)})`,
  `MORNING_HOUR = ${MORNING_HOUR}`,
  `EVENING_HOUR = ${EVENING_HOUR}`,
  `MORNING_IN_MS = ${MORNING_IN_MS} ms (${getTime(MORNING_IN_MS)}, ${getTime(MORNING_IN_MS - TIMEZONE_OFFSET_IN_MS)} server time)`,
  `EVENING_IN_MS = ${EVENING_IN_MS} ms (${getTime(EVENING_IN_MS)}, ${getTime(EVENING_IN_MS - TIMEZONE_OFFSET_IN_MS)} server time)`,
]);

const getRandomUInt = (start = 0, end = Infinity) => Math.floor(Math.random() * (end - start) + start);

const getRandomString = (length = 255) => {
  const result = [];

  for (let i = 0; i < length; i++) {
     result.push(String.fromCharCode(getRandomUInt('a'.charCodeAt(0), 'z'.charCodeAt(0))));
  }

  return result.join('');
};

const gitInit = () => {
  logGit(`(Re)initializing repo (${ORIGIN_URL}) in "${PROJECT_ROOT}"...`);
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
  logCommit(`[commit] Generating commit in "${fileName}" with data "${data}" and message "${commitMessage}"...`);
  shell.cd(PROJECT_ROOT);
  fs.writeFileSync(fileName, data);
  shell.exec('git add .');
  shell.exec(`git commit -am "${commitMessage}"`);
};

const gitPush = () => {
  logPush(`Pushing changes to the remote repo (${ORIGIN_ALIAS}/${ORIGIN_BRANCH})...`);
  shell.exec(`git push ${ORIGIN_ALIAS} ${ORIGIN_BRANCH}`);
};

const generateRandomCommitData = () => getRandomString();

const generateRandomCommitMessage = () => `fake shit: ${getRandomString()}`;

const generateRandomFileName = () => path.resolve(PROJECT_ROOT, `./${getRandomString()}`);

const gitCommit = () => generateCommit(generateRandomFileName(), generateRandomCommitData(), generateRandomCommitMessage());

const scheduleRepetitiveInterval = (logger, fn, intervalStrategy) => {
  const renderTimer = () => {
    const interval = intervalStrategy(logger);
    const executionTime = Date.now() + interval;

    logger(`Next event is scheduled for ${getLocalDate(executionTime)} (${getDate(executionTime)} server time)`);

    const timer = setTimeout(() => {
      clearTimeout(timer);
      logger(`Executing command...`);
      fn();
      logger(`Command completed`);
      renderTimer();
    }, interval);
  };

  return () => renderTimer();
};

const generateOnSpareTime = (logger) => {
  const msSinceBeginningOfTheDay = (Date.now() + TIMEZONE_OFFSET_IN_MS) % DAY_IN_MS;

  let minInterval = EVENING_IN_MS - msSinceBeginningOfTheDay;
  let maxInterval = (DAY_IN_MS - msSinceBeginningOfTheDay) + MORNING_IN_MS;

  if (msSinceBeginningOfTheDay < MORNING_IN_MS) {
    minInterval = MIN_COMMIT_INTERVAL_IN_MS;
    maxInterval = MORNING_IN_MS - msSinceBeginningOfTheDay;

    if (maxInterval > MAX_COMMIT_INTERVAL_IN_MS) {
      maxInterval = MAX_COMMIT_INTERVAL_IN_MS;
    }
  } else if (msSinceBeginningOfTheDay > EVENING_IN_MS) {
    minInterval = MIN_COMMIT_INTERVAL_IN_MS;
    maxInterval = (DAY_IN_MS - msSinceBeginningOfTheDay) + MORNING_IN_MS;

    if (maxInterval > MAX_COMMIT_INTERVAL_IN_MS) {
      maxInterval = MAX_COMMIT_INTERVAL_IN_MS;
    }
  }

  const interval = getRandomUInt(minInterval, maxInterval);

  logger(`Generated waiting interval ${interval} ms (${getTime(interval)}) within range of [${minInterval} ms; ${maxInterval} ms / [${getTime(minInterval)}; ${getTime(maxInterval)})`);

  return interval;
};

const scheduleCommits = scheduleRepetitiveInterval(logCommit, gitCommit, generateOnSpareTime);
const schedulePushes = scheduleRepetitiveInterval(logPush, gitPush, generateOnSpareTime);

const announceTime = () => {
  logSettings('Announcing the current time according to the schedule...');
  printSettings();
};

const scheduleTimeAnnouncements = () => {
  setInterval(announceTime, TIME_ANNOUNCEMENT_INTERVAL_IN_MS);

  announceTime();
};

const run = () => {
  validate();

  scheduleTimeAnnouncements();

  gitInit();
  schedulePushes();
  scheduleCommits();
};

if (require.main === module) {
  run();
}

