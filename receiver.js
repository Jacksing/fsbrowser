var request = require('request');

var fspool = require('./fspool3');

var HEADERS = {
    mozilla: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:44.0) Gecko/20100101 Firefox/44.0',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
};

var SEARCH_ENGINE = "https://www.baidu.com/s?wd=";

var beginGet = function (url, id) {
    console.log(`requesting ${url} ...`);

    var options = {
        url: encodeURI(url),
        headers: HEADERS.mozilla,
    };

    request(options, (err, res, body) => {
        if (err) {
            console.log(`error on requesting ${url}.`);
            // fspool.writeAnswer(id, body);
            fp.emit(id, body);
        }
        else if (res.statusCode != 200) {
            console.log(`get status ${res.statusCode} on requesting ${url}.`);
            // fspool.writeAnswer(id, body);
            fp.emit(id, body);
        }
        else if (res.statusCode == 200) {
            // fspool.writeAnswer(id, body);
            fp.emit(id, body);
        }
    });
};

var handleRq = function (id, classify, data) {
    console.log(`start dealing with ${id}'s request ...`);

    if (classify == "wd") {
        beginGet(SEARCH_ENGINE + data, id);
    }
    else if (classify == "lk") {
        beginGet(data, id);
    }
};

var fp = fspool.listenRequest(handleRq);
