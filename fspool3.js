var fs = require('fs');
var sysPath = require('path');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var chokidar = require('chokidar');

var settings = require('./settings');

var log = console.log.bind(console);

// filename: xxx
// file: xxx.suffix
// path: /path/to/file/xxx.suffix

var guid = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

var getClassify = function (f) {
  return f.split('.').length > 1 ? f.split('.').slice(-1)[0] : '';
};

function mkdirs(dirpath, mode, callback) {
  fs.exists(dirpath, function (exists) {
    if (exists) {
      callback(dirpath);
    } else {
      mkdirs(sysPath.dirname(dirpath), mode, function () {
        fs.mkdir(dirpath, mode, callback);
      });
    }
  });
};

function checkFolder(path) {
  var fullPath = sysPath.join(settings.work_path, path);
  if (!fs.exists(fullPath)) {
    mkdirs(fullPath);
    log(`work path '${fullPath}' created.`);
  }
  return fullPath;
}

var requestFolder = sysPath.join(settings.work_path, 'rq');
var answerFolder = sysPath.join(settings.work_path, 'as');
// var requestFolder = checkFolder('rq'); 
// var answerFolder = checkFolder('as');

function FSRequester(_opts) {
  EventEmitter.call(this);
  var opts = {};
  if (_opts) for (var opt in _opts) opts[opt] = _opts[opt];
  this._watcherList = [];

  function undef(key) {
    return opts[key] === undefined;
  }

  if (undef('showLog')) opts.showLog = true;
  if (undef('timeout')) opts.timeout = 0;

  if (opts.showLog === false) log = l => null;

  if (opts.timeout > 0) {
    setTimeout(function () {
      log(`timeout. ${this._watcherList.length} request closed.`);
      this._watcherList.forEach(watcher => watcher.close());
    }.bind(this), opts.timeout);
  }
}

util.inherits(FSRequester, EventEmitter);

FSRequester.prototype.add = function (classify, content, callback) {
  var filename = guid();
  var classify = classify;
  var file = `${filename}.${classify}`;
  var path = sysPath.join(requestFolder, file);

  fs.writeFile(path, content, function (err) {
    if (err) {
      log(`create request ${file} failed. err: ${err}`);
    }
    else {
      log(`create request ${file} successed.`);
      this.emit('requestPrepared', file);

      if (callback != null) {
        this.once(file, callback);
      }
    }
  }.bind(this));

  return this;
};

FSRequester.prototype.waiting = function (callback) {
  var readAnswer = function (path) {
    var file = sysPath.basename(path);
    fs.readFile(path, function (err, data) {
      if (err) {
        log(`read answer ${file} error. err: ${err}`);
      }
      else {
        log(`read answer ${file} successed. answer: ${data}.`);
      }

      this.emit(file, err, data);
      this.emit('answerReceived', err, file, data);

    }.bind(this));
  }.bind(this);

  this.on('requestPrepared', function (file) {
    var watcher = chokidar
      .watch(sysPath.join(answerFolder, file), { ignoreInitial: true })
      .once('add', path => {
        watcher.close();
        this._watcherList.pop(watcher);
        readAnswer(path);
      });
    this._watcherList.push(watcher);

    log(`waiting answer ${file}`);
  }.bind(this));

  if (callback != null) {
    this.on('answerReceived', callback);
  }

  log(`begin waiting for answer`);

  return this;
};

// test start
// var singleCallback = function (err, answer) {
//   console.log(`this is single answer. answer: ${answer}.`);
// };

// var globleCallback = function (err, file, answer) {
//   console.log(`this is globle answer. file: ${file}, answer: ${answer}.`)
// }

// var rq = new FSRequester({ timeout: 100000, showLog: false, }).add('wd', 'jacksing').add('wd', 'tjx', singleCallback).waiting(globleCallback);
// test end

module.exports.writeRequest = function (classify, content, callback, opts) {
  return new FSRequester(opts).add(classify, content, callback);
}

function FSAnswerer(_opts) {
  EventEmitter.call(this);
  var opts = {};
  if (_opts) for (var opt in _opts) opts[opt] = _opts[opt];

  function undef(key) {
    return opts[key] === undefined;
  }

  if (undef('showLog')) opts.showLog = true;

  if (opts.showLog === false) log = l => null;
}

util.inherits(FSAnswerer, EventEmitter);

FSAnswerer.prototype.listen = function (callback) {
  var answerWriter = function (file) {
    return function (answer) {
      fs.writeFile(sysPath.join(answerFolder, file), answer, (err) => {
        if (err) {
          log(`write answer ${file} failed. err: ${err}`);
        }
        else {
          log(`write answer ${file} successed.`);
        }
      });
    }
  };

  var readRequest = function (path) {
    var file = sysPath.basename(path);
    fs.readFile(sysPath.join(requestFolder, file), function (err, data) {
      if (err) {
        log(`read request ${file} failed. err: ${err}.`);
      }
      else {
        this.once(file, answerWriter(file));
        callback(file, getClassify(file), data.toString().trim());
      }
    }.bind(this));
  }.bind(this);

  chokidar
    .watch(requestFolder, { ignoreInitial: true })
    .on('add', path => {
      readRequest(path);
    });
    
    log('begin listen for request...');

  return this;
}

module.exports.listenRequest = function (callback, opts) {
  return new FSAnswerer(opts).listen(callback);
}