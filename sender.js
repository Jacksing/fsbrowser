var fs = require('fs');
var open = require('open');

var settings = require('./settings');
var fspool = require('./fspool3');

var opts = {
    timeout: 10000,
};

var showAnswer = (err, answer) => {
    var file = `${new Date().getTime()}.html`;
    fs.writeFile(file, answer, (err) => {
        open(`${process.cwd()}\\${file}`);
        setTimeout(() => process.exit(), 2000);
    });
};

var wd = (wd) => { return fspool.writeRequest('wd', wd, showAnswer, opts); };
var lk = (lk) => { return fspool.writeRequest('lk', lk, showAnswer, opts); };

var arguments = process.argv.splice(2);
if (arguments.length > 1) {
    var classify = arguments[0];

    if (settings.allowed_suffix.indexOf(classify) != -1) {
        var data = arguments.splice(1).join(' ');
        var requester = fspool.writeRequest(classify, data, showAnswer, opts).waiting();
    }
}

module.exports = { wd: wd, lk: lk, };