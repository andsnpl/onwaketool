#! /usr/bin/env node

var fs = require('fs');
var path = require('path');

var DEFAULT_JOBS_CONFG_PATH = __dirname + '/jobs.json';
var DEFAULT_JOB_IDLETIME = 1000 * 60 * 30;

var configObjects = {};

var command = process.argv[2].toLowerCase();

switch (command) {
  case 'install':
    // start a daemon if not started (forever-service)
    break;
  case 'add':
    addJobEntryCommand(process.argv.slice(3));
    break;
  case 'remove':
  case 'rm':
    removeJobEntryCommand(process.argv.slice(3));
    break;
  default:
    throw new Error('Unrecognized command ' + command);
}

function parseArgs(tokens) {
  return tokens.reduce(function (args, token) {
    if (token[0] === '-') {
      args.push({ flag: token });
    } else {
      if (!args.length) args.push({});
      var arg = args[args.length - 1];
      arg.arg = [arg.arg, token]
        .filter(function (x) {
          return x;
        })
        .join(' ');
    }
    return args;
  }, []);
}

function updateConfig(configPath, updater) {
  var configObject;

  if (configObjects[configPath]) {
    configObject = configObjects[configPath];
  } else {
    try {
      configObject = require(configPath);
    } catch (e) {
      configObject = {};
    }
    configObjects[configPath] = configObject;
  }

  console.log(configObject);
  configObject = updater(configObject) || configObject;
  console.log(configObject);

  var configText = JSON.stringify(configObject, null, 2);
  fs.writeFileSync(configPath, configText);
}

function unrecognizedArgumentError(command, arg) {
  return new Error(
    'Unrecognized argument for `' + command + '`: ' + arg.flag + ' ' + arg.arg
  );
}

function addJobEntryCommand(args) {
  args = parseArgs(args);
  if (!args.length) {
    throw new Error('`' + command + '` takes at least one argument');
  }
  if (!args[0].flag) args[0].flag = '-c';

  var configPath = DEFAULT_JOBS_CONFG_PATH;
  var jobEntry = {};
  args.forEach(function (arg) {
    switch (arg.flag) {
      case '-c':
      case '--commmand':
        jobEntry.command = arg.arg;
        break;
      case '-n':
      case '--name':
        jobEntry.name = arg.arg;
        break;
      case '-t':
      case '--idletime':
        jobEntry.idleTime = arg.arg;
        break;
      case '-d':
      case '--workdir':
        jobEntry.workDir = path.abspath(arg.arg);
      case '-f':
      case '--config-file':
        configFile = path.abspath(arg.arg);
        break;
      default:
        throw unrecognizedArgumentError(command, arg);
    }
  });
  if (!jobEntry.command) {
    throw new Error('A command must be provided');
  }
  if (!jobEntry.idleTime) {
    jobEntry.idleTime = DEFAULT_JOB_IDLETIME;
  }
  updateConfig(configPath, function (configObject) {
    if (!configObject.jobs) configObject.jobs = [];
    configObject.jobs.push(jobEntry);
  });
}

function removeJobEntryCommand(args) {
  args = parseArgs(args);
  if (!args.length) {
    throw new Error('`' + command + '` takes at least one argument');
  }
  if (!args[0].flag) args[0].flag = '-c';

  var configPath = DEFAULT_JOBS_CONFG_PATH;
  var jobNames = [];
  args.forEach(function (arg) {
    switch (arg.flag) {
      case '-c':
      case '--command':
        jobNames = jobNames.concat(arg.arg.split(' '));
        break;
      case '-f':
      case '--config':
        configPath = path.abspath(arg.arg);
        break;
      default:
        throw unrecognizedArgumentError(command, arg);
    }
  });
  updateConfig(configPath, function (configObject) {
    configObject.jobs = configObject.jobs.filter(function (jobEntry) {
      return jobNames.indexOf(jobEntry.name || jobEntry.command) === -1;
    });
  });
}
