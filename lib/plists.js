module.exports = {
  plist: plist,
  renderContent: renderContent,
  renderDict: renderDict,
  renderArray: renderArray,
};

function plist(content) {
  var dtd = [
    '"-//Apple//DTD PLIST 1.0//EN"',
    '"http://www.apple.com/DTDs/PropertyList-1.0.dtd"',
  ];
  var doctype = '<!DOCTYPE plist PUBLIC ' + dtd.join(' ') + '>';
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    doctype +
    '<plist version="1.0">' +
    renderContent(content) +
    '</plist>'
  );
}

function renderContent(content) {
  if (typeof content === 'string' || content instanceof String)
    return renderString(content);
  if (typeof content === 'boolean' || content instanceof Boolean)
    return renderBoolean(content);
  if (typeof content === 'object' && content instanceof Array)
    return renderArray(content);
  if (typeof content === 'object' && content) return renderDict(content);
  if (content === undefined) return '';
  throw new Error('Unrecognized content type: ' + content);
}

function renderDict(dict) {
  return (
    '<dict>' +
    Object.keys(dict)
      .map(function (key) {
        if (dict[key] === undefined) return '';
        return '<key>' + key + '</key>' + renderContent(dict[key]);
      })
      .join('') +
    '</dict>'
  );
}

function renderArray(array) {
  return '<array>' + array.map(renderContent).join('') + '</array>';
}

function renderString(string) {
  return '<string>' + string + '</string>';
}

function renderBoolean(boolean) {
  return boolean ? '<true />' : '<false />';
}
