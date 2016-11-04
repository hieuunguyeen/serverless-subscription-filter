'use strict';

const Promise = require('bluebird');

class SubscriptionFilterPlugin {
  constructor(_serverless, _options) {

    this.serverless = _serverless;
    this.options = _options;

    // This plugin supports only Amazon Web Service Cloudwatch
    this.provider = 'aws';

    this.commands = {
      subscriptionfilter: {
        commands: {
          register: {
            usage: 'Register a subscription filter for a function, pipe that into a targeted lambda, and listen for a specified pattern',
            lifecycleEvents: ['register'],
            options: {
              function: {
                usage: 'Specify the function you want to register a subscription filter for (e.g. "--function myFunction")',
                shortcut: 'f',
                required: true,
              },
              target: {
                usage: 'Specify the function to listen for the log (e.g. "--target targetFunction")',
                shortcut: 't',
                required: true,
              },
              pattern: {
                usage: 'Specify the pattern to filter (e.g. "--pattern filterPattern")',
                shortcut: 'p',
                required: true,
              },
              name: {
                usage: 'Specify the name of the filter (e.g. "--name someName")',
                shortcut: 'n',
                required: true,
              },
            },
          },
          remove: {
            usage: 'Remove a subscription filter for a function',
            lifecycleEvents: ['remove'],
            options: {
              function: {
                usage: 'Specify the function whose filter you want to remove (e.g. "--function myFunction")',
                shortcut: 'f',
                required: true,
              },
            },
          },
          // Load settings from a file
          // loadfrom: {
          //   usage: 'Load subscription filter plugin settings from a file with specified path',
          //   lifecycleEvents: ['loadfrom'],
          //   options: {
          //     path: {
          //       usage: 'Specify the path to the config js/json file (e.g. "--path a/b/c/sdf.js")',
          //       shortcut: 'p',
          //       required: true,
          //     },
          //   },
          // },
        },
      },
    };

    this.hooks = {
      'subscriptionfilter:register:register': this.registerSubscriptionFilter.bind(this),
      'subscriptionfilter:remove:remove': this.removeSubscriptionFilter.bind(this),
      // 'subscriptionfilter:loadfrom:loadfrom': this.loadSettingsAndRun.bind(this),
    };
  }

  registerSubscriptionFilter() {
    const source = this.serverless.service.getFunction(this.options.function);
    const target = this.serverless.service.getFunction(this.options.target);

    const filterName = this.options.name;
    const stage = this.serverless.service.provider.stage;
    const region = this.serverless.service.provider.region;
    const pattern = this.options.pattern;

    const logGroupName = `/aws/lambda/${source.name}`;
    return this.getFunctionArn(target.name, stage, region)
      .then(targetArn => {
        console.log(targetArn);
        return this.removeLogPermission(targetArn, target.name, stage, region)
          .delay(2000)
          .then(() => this.addLogPermission(targetArn, target.name, stage, region))
          .delay(2000)
          .then(() => this.removeSubscriptionFilter(filterName, logGroupName, stage, region))
          .delay(2000)
          .then(() => this.createSubscriptionFilter(targetArn, filterName, pattern, logGroupName, stage, region));
      });
  }

  addLogPermission(arn, loggingFunctionName, stage, region) {
    const params = {
      FunctionName: arn,
      StatementId: loggingFunctionName,
      Action: 'lambda:InvokeFunction',
      Principal: `logs.${region}.amazonaws.com`,
    };
    return this.serverless.getProvider('aws')
      .request('Lambda', 'addPermission', params, stage, region)
      .then(data => {
        console.log(`Successfully added log permission for ${params.FunctionName}!`);
        return Promise.resolve(data);
      });
  }

  removeLogPermission(arn, loggingFunctionName, stage, region) {
    const params = {
      FunctionName: arn,
      StatementId: loggingFunctionName,
    };
    console.log(`Removing log permission for ${loggingFunctionName}`);
    return this.serverless.getProvider('aws', params)
      .request('Lambda', 'removePermission', params, stage, region)
      .then(data => {
        console.log(`Successfully removed log permission for ${params.FunctionName}!`);
        return Promise.resolve(data);
      })
      .catch(error => {
        if (error.statusCode === 404) {
          console.log(`Log permission for ${params.FunctionName} does not exist, skipping`);
          return Promise.resolve();
        }
        return Promise.reject(error);
      });
  }

  createSubscriptionFilter(destinationArn, filterName, filterPattern, logGroupName, stage, region) {
    const params = {
      destinationArn: destinationArn, /* required */
      filterName: filterName,
      filterPattern: filterPattern,
      logGroupName: logGroupName,
    };
    console.log(`Putting subscription filter for ${logGroupName} ...`);
    return this.serverless.getProvider('aws')
      .request('CloudWatchLogs', 'putSubscriptionFilter', params, stage, region)
      .then(data => {
        console.log(`Successfully created subscription filter for ${params.logGroupName}!`);
        return Promise.resolve(data);
      });
  }

  removeSubscriptionFilter(filterName, logGroupName, stage, region) {
    const params = {
      filterName: filterName, /* required */
      logGroupName: logGroupName, /* required */
    };
    console.log(`Deleting subscription filter for ${logGroupName} ...`);
    return this.serverless.getProvider('aws')
      .request('CloudWatchLogs', 'deleteSubscriptionFilter', params, stage, region)
      .then(data => {
        console.log(`Successfully deleted subscription filter for ${params.logGroupName}!`);
        return Promise.resolve(data);
      })
      .catch(error => {
        if (error.statusCode === 400) {
          console.log(`Subscription filter for ${params.FunctionName} does not exist, skipping`);
          return Promise.resolve();
        }
        return Promise.reject(error);
      });
  }

  getFunctionArn(functionName, stage, region) {
    const params = {
      FunctionName: functionName,
    };
    return this.serverless.getProvider('aws')
      .request('Lambda', 'getFunction', params, stage, region)
      .then(data => {
        console.log('Successfully retrieved functionArn for ', functionName);
        return Promise.resolve(data.Configuration.FunctionArn);
      });
  }
}

module.exports = SubscriptionFilterPlugin;
