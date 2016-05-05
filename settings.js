// wd: word to be query on search engine.
// lk: url link.
// rs: resources like css/js/png files.
var allowed_suffix = ['wd', 'lk', 'rs'];

var settings = {
    work_path: 'Y:\\temp\\Jacksing\\ndpool\\',
    // work_path: 'ndpool/',
    new_line: '\r\n',
    allowed_suffix: allowed_suffix,
    answer_suffix: 'as',
    validSuffix: suffix => allowed_suffix.indexOf(suffix) != -1 ? suffix : null,
};

module.exports = settings;
