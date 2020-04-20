#! /usr/bin/env node

var install = require('./commands/install');
var add = require('./commands/add');
var remove = require('./commands/remove');
var run = require('./commands/run');

var context = {
  dirname: __dirname,
};

var command = process.argv[2].toLowerCase();
var commandArgs = process.argv.slice(3);

switch (command) {
  case 'install':
    install(context, commandArgs);
    break;
  case 'add':
    add(context, commandArgs);
    break;
  case 'remove':
  case 'rm':
    remove(context, commandArgs);
    break;
  case 'run':
    run(context, commandArgs);
    break;
  default:
    throw new Error('Unrecognized command ' + command);
}
