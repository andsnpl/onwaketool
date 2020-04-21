module.exports = function parseArgs(tokens) {
  return tokens.reduce(function (args, token) {
    if (token[0] === '-') {
      args.push({ flag: token.toLowerCase(), boolean: true });
    } else {
      if (!args.length) args.push({});
      var arg = args[args.length - 1];
      arg.value = arg.value ? arg.value + ' ' + token : token;
      arg.boolean = parseInt(arg.value) || arg.value.toLowerCase === 'true';
    }
    return args;
  }, []);
};
