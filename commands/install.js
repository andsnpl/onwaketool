var path = require('path');
var shell = require('shelljs');
var parseArgs = require('../lib/parseArgs');
var plists = require('../lib/plists');
var defaults = require('../lib/defaults');
var logger = require('../lib/logger');

function binScript(module, script) {
  if (script === undefined) script = module;
  var resolved = require.resolve(module);
  var paths = require.resolve.paths(module);
  for (var i = 0; i < paths.length; i++) {
    if (resolved.indexOf(paths[i]) === 0) {
      return paths[i] + '/.bin/' + script;
    }
  }
}

function composePlist(plistName, configPath, logDir, debugFlag) {
  var forever = binScript('forever');
  var foreverLog = path.join(logDir, 'onwaked.forever.log');
  var daemon = require.resolve('../onwaked');
  var daemonLog = path.join(logDir, 'onwaked.stdout.log');
  var daemonErrors = path.join(logDir, 'onwaked.stderr.log');
  return plists.plist({
    Label: plistName,
    RunAtLoad: true,
    WorkingDirectory: path.dirname(daemon),
    EnvironmentVariables: {
      ONWAKED_JOBS: configPath,
      ONWAKED_LOGDIR: logDir,
      ONWAKED_DEBUG: debugFlag.toString(),
      PATH: process.env.PATH,
    },
    Program: forever,
    ProgramArguments: [
      'start',
      '-a',
      '-l',
      foreverLog,
      '-o',
      daemonLog,
      '-e',
      daemonErrors,
      daemon,
    ],
  });
}

function installService(plistName, plistText) {
  var plistLocation = path.join(
    process.env.HOME,
    'Library/LaunchAgents',
    plistName + '.plist'
  );
  shell.echo(plistText).to(plistLocation);
  shell.exec('launchctl unload ' + plistLocation, { fatal: true });
  shell.exec('launchctl load ' + plistLocation, { fatal: true });
  shell.exec('launchctl start ' + plistLocation, { fatal: true });
  logger.info({ message: 'Installed plist', plistLocation: plistLocation });
}

module.exports = function install(context, args) {
  args = parseArgs(args);
  var configPath = path.resolve(
    context.dirname,
    defaults.DEFAULT_JOBS_CONFG_PATH
  );
  var logDir = path.resolve(context.dirname, 'logs/');
  var debugFlag = false;
  args.forEach(function (arg) {
    switch (arg.flag) {
      case '-f':
      case '--config':
        configPath = path.resolve(context.dirname, arg.value);
        break;
      case '-l':
      case '--logdir':
        logDir = path.resolve(context.dirname, arg.value);
      case '--debug':
        debugFlag = arg.boolean;
        break;
      default:
        throw new Error(
          'Unrecognized argument to `install`: ' + JSON.stringify(arg)
        );
    }
  });
  var plistName = 'pl.andsn.onwaketool';
  var plistText = composePlist(plistName, configPath, logDir, debugFlag);
  shell.mkdir('-p', logDir);
  installService(plistName, plistText);
};
