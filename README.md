# Fake Activity Generator

A small script to generate fake activity. Can be run as a daemon. 


## Dependencies

To run this, you need Node.js (preferably, 8.12.0 LTS) and npm. To install the dependencies, run the following command:

```sh
$ npm i
```


## Running the script

### Simple mode

First, create a repo for a fake activity (it might be a private repo as well). Then make sure you've added your SSH key to your GitHub account. The scripts works with SSH access only (due to running in a non-interactive mode). To start the script, you have to specify some environment variables. You can use the following command as an example setting up everything needed:

```sh
$ ORIGIN_URL=$YOUR_REPO_SSH_URL USER_NAME=$YOUR_GIT_USER_NAME USER_EMAIL=$YOUR_GIR_USER_EMAIL npm start
```

If you want to set a custom timezone (i.e. if you want the script to generate the commits only for working hours in a specific timezone different from the one on the environment you run the script), please specify `TIMEZONE_OFFSET` variable as well. This variable should be assigned a number of milliseconds corresponsing to your timezone difference. I.e. for Berlin, it might be `3600000` (+1 hour).

For example, for the current repo we might have something like that:

```sh
$ ORIGIN_URL=git@github.com:devlato/fake-activity.git USER_NAME=devlato USER_EMAIL=github@devlato.com TIMEZONE_OFFSET=3600000 npm start
```

This command actually translates into the script call:

```sh
$ ORIGIN_URL=git@github.com:devlato/fake-activity.git USER_NAME=devlato USER_EMAIL=github@devlato.com TIMEZONE_OFFSET=3600000 node ./index.js
```

For the full list of supported commands, please consider reading the `package.json` file, the section called `scripts`.

However, script supports other environment variables as well, not limited to the ones listed above. To get the full list of supported environment variables, use the command:

```sh
$ npm run help
```

Or just point the script directly:

```sh
$ node ./index.js help
```

### Running with a supervisor

This project has a dependency of [PM2](http://pm2.keymetrics.io/) in case you want to run it with PM2. To run the script with PM2, firstly, please copy `ecosystem.config.template.js` to `ecosystem.config.js`:

```sh
$ cp ecosystem.config.template.js ecosystem.config.js
```

Then edit it and specify the required environment variables there. If it looks unclear for you, please check the PM2 [documentation](http://pm2.keymetrics.io/docs/usage/environment/) for details.

After all, run the script in a supervisor mode:

```sh
$ npm run daemon
```

To check the status of the running script, please type:

```sh
$ npm run ps
```

To check the logs, use the following command:

```sh
$ npm run logs
```

To stop the script daemon, consider typing this:

```sh
$ npm run stop # So, 'run' or 'stop'? Looks confusing, isn't it? :-)
```


## Contributing

Feel free to report any issues and to send PRs.


## License

(c) 2019 devlato https://github.com/devlato

This code is available the MIT license and free to be distributed.

