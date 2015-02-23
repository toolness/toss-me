var fs = require('fs');
var path = require('path');
var http = require('http');
var slugify = require('slugify');
var basicAuth = require('basic-auth');
var WebSocketServer = require('ws').Server;
var express = require('express');
var watchify = require('watchify');
var browserify = require('browserify');

var DEBUG = 'DEBUG' in process.env;
var UPLOAD_DIR = __dirname + '/static/uploads';
var PORT = process.env.PORT || 3000;
var USERPASS = (process.env.USERPASS || '').split(':');

var connections = [];
var bundler = watchify(browserify('./browser-main.js', {
  cache: {},
  packageCache: {},
  debug: DEBUG,
  fullPaths: true
}));
var app = express();
var server, webSocketServer;

function findBestFilename(filename) {
  var extname = path.extname(filename);
  var basename = slugify(path.basename(filename, extname));
  var i = 0;
  var candidate = basename + extname;

  while (fs.existsSync(path.join(UPLOAD_DIR, candidate))) {
    i++;
    candidate = basename + '-' + i + extname;
  }

  return candidate;
}

function getUploads() {
  return fs.readdirSync(UPLOAD_DIR).map(function(filename) {
    return {
      url: '/uploads/' + filename,
      filename: filename
    };
  });
}

function send(ws, msg) {
  ws.send(JSON.stringify(msg), function(err) {
    // Ignore errors.
  });
}

function broadcast(msg) {
  connections.forEach(function(ws) {
    send(ws, msg);
  });
}

function bundle() {
  console.log("Rebuilding bundle.");
  bundler.bundle()
    .on('error', function(err) {
      console.log(err.toString());
    })
    .pipe(fs.createWriteStream(__dirname + '/static/browser-main.js'));
}

if (!fs.existsSync(UPLOAD_DIR))
  fs.mkdirSync(UPLOAD_DIR);

bundler.transform('reactify');
bundler.on('update', bundle);
bundle();

if (USERPASS.length == 2)
  app.use(function(req, res, next) {
    var user = basicAuth(req);
    if (!user || user.name != USERPASS[0] ||
        user.pass != USERPASS[1]) {
      res.set('WWW-Authenticate',
              'Basic realm=Authorization Required');
      return res.sendStatus(401);
    }

    next();
  });

app.post('/upload/:filename', function(req, res, next) {
  var filename = findBestFilename(req.params['filename']);
  var outfile = fs.createWriteStream(UPLOAD_DIR + '/' + filename);

  outfile.on('finish', function() {
    res.send('file uploaded!');
  });
  req.pipe(outfile);
});

app.use(express.static(__dirname + '/static'));

server = http.createServer(app);

server.listen(PORT, function() {
  console.log("listening on port " + PORT);
});

webSocketServer = new WebSocketServer({server: server});

webSocketServer.on('connection', function(ws) {
  connections.push(ws);

  send(ws, getUploads());

  ws.on('close', function() {
    var index = connections.indexOf(ws);
    if (index != -1)
      connections.splice(index, 1);
  });
});

fs.watch(UPLOAD_DIR, function() {
  broadcast(getUploads());
});
