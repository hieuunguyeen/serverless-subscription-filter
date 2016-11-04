# Serverless plugin
## serverless-subscription-filter

Register and pipe the logs of one lambda to another to process.

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)

### Installation
Make sure you have Node.js v4.0+ and Serverless Framework installed
Install plugin in the root level of your Serverless project

**Supports only Serverless@^1.0.0, lower versions are incompatible**

`npm install --save-dev serverless-subscription-filter`

Append the plugin's name to serverless plugins list in `serverless.yml`
```yml
plugins:
  - serverless-subscription-filter
```

### Current supports:
1. Register a subscription filter for a lambda by its name

### Incoming supports:
1. Remove subscription filter for a lambda
2. Load settings from a file by path
3. Batch + Async execution
4. **More? Bring it on!**

### Usage
```sh
serverless subscriptionfilter register --function sourceFunction --target targetFunction --pattern patternToFilter --name nameOfTheFilter
```

`-f --function` The source function's name, name are how you describe in `serverless.yml`

`-t --target` The target function's name, name are how you describe in `serverless.yml`

`-p --pattern` The pattern to filter for

`-n --name` Name of the subscription filter
