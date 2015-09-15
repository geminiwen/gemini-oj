/**
 * Created by geminiwen on 15/9/15.
 */
var mysql = require("mysql");
var fs = require("fs");
var rimraf = require("rimraf");
var config = require("./config").mysql;

var pool = mysql.createPool(config);

function resolveResult(request, result) {
    var statusId = request['statusId'];
    var judgeResult = result['judgeResult'];
    var problemId = request['problemId'];
    var timeUsed = result['timeUsed'] || 0;
    var memoryUsed = result['memoryUsed'] || 0;
    var sourceFile = request['sourceFile'];
    var execFile = request['execFile'];
    var outputFile = request['outputFile'];
    var workDir = request['workDir'];

    pool.query("update `status` set `result` = ?, `time_used` = ?, `memory_used` = ? where `id` = ?",
              [judgeResult, timeUsed, memoryUsed, statusId], function (e) {
            if (e) {
                console.log(e);
            }
        });
    if (judgeResult == 0) {
        pool.query("update `problem` set `accept` = `accept` + 1 where `id` = ?",
                   [problemId], function (e) {
                if (e) {
                    console.log(e);
                }
            });
    }
    rimraf(workDir, function (e) {
        if (e) {
            console.log(e);
        }
    });
}

exports.resolve = resolveResult;