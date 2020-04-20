var path = require('path');
var shell = require('shelljs');
var plists = require('../lib/plists');
var defaults = require('../lib/defaults');

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

function composePlist(plistName, configPath, logDir) {
  var forever = binScript('forever');
  var foreverLog = path.join(logDir, 'onwaked.forever.log');
  var daemon = require.resolve('../onwaked');
  var daemonLog = path.join(logDir, 'onwaked.log');
  var daemonErrors = path.join(logDir, 'onwaked.error.log');
  var args = [
    'start',
    '-a',
    '-l',
    foreverLog,
    '-o',
    daemonLog,
    '-e',
    daemonErrors,
    daemon,
  ];
  return plists.plist({
    Label: plistName,
    WorkingDirectory: path.dirname(daemon),
    EnvironmentVariables: {
      ONWAKETOOL_JOBS: configPath,
      PATH: process.env.PATH,
    },
    Program: forever,
    ProgramArguments: args,
    RunAtLoad: true,
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
  console.log('installed plist to:', plistLocation);
}

module.exports = function install(context, args) {
  var configPath = path.resolve(
    context.dirname,
    defaults.DEFAULT_JOBS_CONFG_PATH
  );
  var logDir = path.resolve(context.dirname, 'logs/');
  args.forEach(function (arg) {
    switch (arg.flag) {
      case '-f':
      case '--config':
        configPath = path.resolve(context.dirname, arg.value);
        break;
      case '-l':
      case '--logdir':
        logDir = path.resolve(context.dirname, arg.value);
      default:
        throw new Error(
          'Unrecognized argument to `install`: ' + JSON.stringify(arg)
        );
    }
  });
  var plistName = 'pl.andsn.onwaketool';
  var plistText = composePlist(plistName, configPath, logDir);
  shell.mkdir('-p', logDir);
  installService(plistName, plistText);
};
