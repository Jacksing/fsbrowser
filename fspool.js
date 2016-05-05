var fs = require('fs');

var settings = require('./settings');
var events = require('events');

var emitter = new events.EventEmitter();

var getClassify = f => f.split('.').length > 1 ? f.split('.').slice(-1)[0] : '';
var getAnswerFile = f => `${f}.${settings.answer_suffix}`;
var notEmittered = id => emitter.listeners(id).length == 0;

var _id;

var writeRq = (classify, data, handler) => {
    var timeStamp = new Date().getTime();
    var file = `${timeStamp}.${classify}`;
    fs.writeFile(settings.work_path + file, data, (err) => {
        if (err) {
            console.log(`write request ${file} failed.`);
            handler(err, '');
        }
        else {
            console.log(`write request ${file} successed.`);
            handler(err, file);
        }
    });
};

var readRq = (file, classify, handler) => {
    var fullFile = settings.work_path + file;
    fs.readFile(fullFile, function (err, data) {
        if (err) {
            console.log(`read request ${fullFile} error.`);
        }
        else {
            emitter.once(file, createAnswerWriter(file));
            handler(file, classify, data.toString().trim());
        }
    });
};

var readAnswer = (file, handler) => {
    var fullFile = settings.work_path + getAnswerFile(file);
    fs.readFile(fullFile, function (err, data) {
        if (err) {
            console.log(`read result ${fullFile} error.`);
        }
        handler(err, data.toString());
    });
};

var createAnswerWriter = function (file) {
    return function (answer) {
        console.log(`writing ${file}'s result ...`);
        fs.writeFile(settings.work_path + getAnswerFile(file), answer, (err) => {
            if (err) {
                console.log(`write ${file}'s result failed.`);
            }
            else {
                console.log(`write ${file}'s result successed.`);
            }
        });
    }
};

var searchRq = function (handler) {
    fs.readdir(settings.work_path, function (err, files) {
        if (err) {
            console.log('read dir error.');
        }
        else {
            files.forEach(function (file) {
                // an invalid classify gets null here.
                var classify = settings.validSuffix(getClassify(file));

                // an allow request and not be answered.
                if (classify && files.indexOf(getAnswerFile(file)) == -1 && notEmittered(file)) {
                    console.log(`new request ${file}`);
                    readRq(file, classify, handler);
                }
            });
        }
    });
};

var searchAnswer = function (file, handler) {
    fs.readdir(settings.work_path, function (err, files) {
        if (err) {
            console.log('read dir error.');
        }
        else {
            var answerFile = getAnswerFile(file);
            if (files.indexOf(answerFile) != -1) {
                clearInterval(_id);
                readAnswer(file, handler);
            }
        }
    });
};

var listenSender = (handler, time) => { setInterval(() => searchRq(handler), time); };
var listenAnswer = (file, handler, time) => {
    _id = setInterval(() => searchAnswer(file, handler), time)
};

module.exports = {
    listenAnswer: listenAnswer,
    listenSender: listenSender,
    writeAnswer: (id, answer) => emitter.emit(id, answer),
    writeRequest: writeRq,
};
