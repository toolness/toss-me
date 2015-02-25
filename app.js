var fs = require('fs');
var path = require('path');
var http = require('http');
var _ = require('underscore');
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
var HAS_USERPASS = USERPASS.length == 2;

var filesBeingUploaded = {};
var connections = [];
var bundler = watchify(browserify('./browser-main.js', {
  cache: {},
  packageCache: {},
  debug: DEBUG,
  fullPaths: true
}));
var app = express();
var server, webSocketServer;

function findBestFilename(filename, intermediateExt) {
  var extname = path.extname(filename);
  var basename = slugify(path.basename(filename, extname));
  var i = 0;
  var candidate = basename + intermediateExt + extname;

  while (fs.existsSync(path.join(UPLOAD_DIR, candidate))) {
    i++;
    candidate = basename + '-' + i + intermediateExt + extname;
  }

  return candidate;
}

function getUploads() {
  var uploads = fs.readdirSync(UPLOAD_DIR).map(function(filename) {
    return {
      isUploading: filename in filesBeingUploaded,
      lastModified: fs.statSync(path.join(UPLOAD_DIR, filename)).mtime,
      url: '/uploads/' + filename,
      filename: filename
    };
  });

  uploads = _.sortBy(uploads, 'lastModified');
  uploads.reverse();

  return {
    type: 'uploads',
    uploads: uploads
  };
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

function bundle(cb) {
  cb = typeof(cb) == 'function' ? cb : function() {};
  console.log("Rebuilding bundle.");
  bundler.bundle()
    .on('error', function(err) {
      broadcast({type: 'error', message: err.toString()});
      console.log(err.toString());
      cb(err);
    })
    .pipe(fs.createWriteStream(__dirname + '/static/browser-main.js'))
    .on('finish', function() {
      if (DEBUG) broadcast({type: 'reload'});
      cb(null);
    });
}

if (!fs.existsSync(UPLOAD_DIR))
  fs.mkdirSync(UPLOAD_DIR);

bundler.transform('reactify');
bundler.on('update', bundle);

if (HAS_USERPASS)
  app.use(function(req, res, next) {
    if (/^\/uploads\/.*\.public\./.test(req.path))
      return next();
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
  var isPublic = (req.headers['x-is-public'] == '1');
  var filename = findBestFilename(req.params['filename'],
                                  isPublic ? '.public' : '');
  var outfile = fs.createWriteStream(UPLOAD_DIR + '/' + filename);

  filesBeingUploaded[filename] = true;
  setTimeout(function() {
    outfile.on('finish', function() {
      res.send('file uploaded!');
      delete filesBeingUploaded[filename];
      broadcast(getUploads());
    });
    req.pipe(outfile);
  }, 1000);
});

app.get('/', function(req, res, next) {
  res.cookie('config', JSON.stringify({
    HAS_USERPASS: HAS_USERPASS
  }));
  next('route');
});

app.use(express.static(__dirname + '/static'));

server = http.createServer(app);

bundle(function(err) {
  if (err) throw err;

  server.listen(PORT, function() {
    console.log("listening on port " + PORT);
  });
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

if (DEBUG)
  fs.watch(__dirname + '/static/index.html', function(e) {
    broadcast({type: 'reload'});
  });
