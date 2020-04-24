var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var logger = require('./logger');

var configFiles = {};

module.exports = {
  updateConfig: function updateConfig(configPath, updater) {
    shell.mkdir('-p', path.dirname(configPath));

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

    var oldConfigObject = JSON.parse(JSON.stringify(configObject));
    configObject = updater(configObject) || configObject;
    logger.info({
      message: 'updated config file',
      configPath: configPath,
      changes: { before: oldConfigObject, after: configObject },
    });

    var configText = JSON.stringify(configObject, null, 2);
    fs.writeFileSync(configPath, configText);
  },
};
