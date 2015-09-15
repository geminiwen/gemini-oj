/**
 * Created by geminiwen on 15/9/15.
 */
var mysql = require("mysql");
var fs = require("fs");

var pool = mysql.createPool({
    "host": "192.168.99.100",
    "user": "root",
    "password": "123456",
    "database": "oj",
    "charset": "utf8mb4_unicode_ci"
});

function resolveResult(request, result) {
    var statusId = request['statusId'];
    var judgeResult = result['judgeResult'];
    var problemId = request['problemId'];
    var timeUsed = result['timeUsed'];
    var memoryUsed = result['memoryUsed'];
    var sourceFile = request['sourceFile'];
    var execFile = request['execFile'];
    var outputFile = request['outputFile'];

    pool.query("update `status` set `result` = ?, `time_used` = ?, `memory_used` = ? where `id` = ?",
              [judgeResult, timeUsed, memoryUsed, statusId]);
    if (judgeResult == 0) {
        pool.query("update `problem` set `accept` = `accept` + 1 where `id` = ?",
                   [problemId]);
    }
    fs.unlink(sourceFile);
    fs.unlink(execFile);
    fs.unlink(outputFile);
}

exports.resolve = resolveResult;