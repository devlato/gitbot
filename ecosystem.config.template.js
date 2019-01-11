module.exports = {
  apps : [{
    name: 'GitBot',
    script: './src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      TIMEZONE_OFFSET: 0, // Feel free to specify your timezone offset in milliseconds
      ORIGIN_URL: '',     // Here goes your private repo's SSH URL
      USER_NAME: '',      // Your git user name (for commits)
      USER_EMAIL: '',     // Your git user email (for commits as well)
    },
    env_production: {
      NODE_ENV: 'production',
      TIMEZONE_OFFSET: 0, // Feel free to specify your timezone offset in milliseconds
      ORIGIN_URL: '',     // Here goes your private repo's SSH URL
      USER_NAME: '',      // Your git user name (for commits)
      USER_EMAIL: '',     // Your git user email (for commits as well)
    },
  }],
};

