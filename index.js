'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');

const REGION = 'eu-west-1';

const CloudWatchLogs = new AWS.CloudWatchLogs({ region: REGION });
const Lambda = new AWS.Lambda({ region: REGION });

Promise.promisifyAll(CloudWatchLogs, { suffix: 'Promise' });
Promise.promisifyAll(Lambda, { suffix: 'Promise' });

class SubscriptionFilterPlugin {
  constructor(_serverless, _options) {

    this.serverless = _serverless;
    this.options = _options;

    this.commands = {
      subscriptionfilter: {
        commands: {
          // Register a subscription filter for a function, pipe that into a targeted lambda, and listen for a specified pattern
          register: {
            options: {
              function: {
                usage: 'Specify the function you want to register a subscription filter for (e.g. "--function myFunction")',
                shortcut: 'f',
                required: true,
              },
              target: {
                usage: 'Specify the function to listen for the log (e.g "--target targetFunction")',
                shortcut: 't',
                required: true,
              },
              pattern: {
                usage: 'Specify the pattern to filter (e.g "--pattern filterPattern")',
                shortcut: 'p',
                required: true,
              },
              name: {
                usage: 'Specify the name of the filter (e.g "--name someName")',
                shortcut: 'n',
              },
            },
          },
          remove: {
            options: {
              function: {
                usage: 'Specify the function whose filter you want to remove (e.g. "--function myFunction")',
                shortcut: 'f',
                required: true,
              },
            },
          },
        },
      },
    };

    this.hooks = {
      'after:invoke': this.registerSubscriptionFilter.bind(this),
    };
  }

  registerSubscriptionFilter() {
    const lambda = this.serverless.service.getFunction(this.options.function);
    const target = this.serverless.service.getFunction(this.options.target);
    const pattern = this.serverless.service.getFunction(this.options.pattern);
    const name = this.serverless.service.getFunction(this.options.name);
  }
}

module.exports = SubscriptionFilterPlugin;
