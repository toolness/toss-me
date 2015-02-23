var React = require('react');

var App = require('./app.jsx');

function socketURL(path) {
  var protocol = location.protocol == 'https:' ? 'wss:' : 'ws:';
  return protocol + '//' + location.host + path;
}

onload = function() {
  React.render(
    React.createElement(App, {
      socketURL: socketURL('/socket')
    }),
    document.body
  );
};
