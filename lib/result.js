/**
 * Created by geminiwen on 15/9/15.
 */
var mysql = require("mysql");
var fs = require("fs");
var rimraf = require("rimraf");
var config = require("./config").mysql;
var Q = require("q");
var md5 = require("md5");
var moment = require("moment");

var pool = mysql.createPool(config);

var errorHandler = function (e) {
    if (e) {
        console.error(e);
    }
};

function resolveResult(request, result) {
    var workDir = request['workDir'];
    var contestId = request['contestId'] || -1;


    if (contestId == -1) {
        resolveNormalQuestion(request, result);
    } else {
        resolveContestProblem(request, result);
    }
    rimraf(workDir, errorHandler);
}

function resolveNormalQuestion(request, result) {
    var statusId = request['statusId'];
    var judgeResult = result['judgeResult'];
    var problemId = request['problemId'];
    var userId = request['userId'];
    var timeUsed = result['timeUsed'] || 0;
    var memoryUsed = result['memoryUsed'] || 0;
    var sourceFile = request['sourceFile'];
    var execFile = request['execFile'];
    var outputFile = request['outputFile'];
    var workDir = request['workDir'];


    var work = function(conn) {
        //处理普通问题
        Q.nfcall(conn.beginTransaction)
        .then(function () {
            var queryQueue = [];
            var updateStatus = Q.nfcall(conn.query, "update `status` set `result` = ?, `time_used` = ?, `memory_used` = ? where `id` = ?",
                [judgeResult, timeUsed, memoryUsed, statusId]);

            queryQueue.push(updateStatus);

            if (judgeResult == 0) {
                var updateProblem = Q.nfcall(conn.query, "update `problem` set `accept` = `accept` + 1 where `id` = ?",
                    [problemId]);
                var updateUser = Q.nfcall(conn.query, "update `user` set `accept` = `accept` + 1 where `id` = ?",
                    [userId]);
                queryQueue.push(updateProblem, updateUser);
            }
            return Q.all(queryQueue);
        })
        .then(function () {
            return Q.nfcall(conn.commit);
        })
        .fail(function (e) {
            console.log(e);
            conn.rollback(errorHandler);
        })
        .finally(function () {
           conn.release();
        });
    };


}

function resolveContestProblem(request, result) {
    var statusId = request['statusId'];
    var judgeResult = result['judgeResult'];
    var problemId = request['problemId'];
    var userId = request['userId'];
    var timeUsed = result['timeUsed'] || 0;
    var memoryUsed = result['memoryUsed'] || 0;
    var sourceFile = request['sourceFile'];
    var execFile = request['execFile'];
    var outputFile = request['outputFile'];
    var workDir = request['workDir'];
    var contestId = request['contestId'];

    //处理比赛问题
    var hashId = md5(contestId);
    var statusTableName = 'contest_status_' + hashId;
    var problemTableName = 'contest_problem_' + hashId;
    var ranklistTableName = 'contest_ranklist_' + hashId;



    var work = function (conn) {
        conn.query("select `start_time` from `contest` where `id` = ? limit 1", [contestId], function (err, result) {
            if (err) {
                console.error(err);
                return;
            }

            var startTime = result[0]['start_time'];
            var timeSpend = moment().unix() - moment(startTime).unix();

            Q.nfcall(conn.beginTransaction.bind(conn))
                .then(function () {
                    console.log(arguments);
                    var queryQueue = [];

                    var updateStatus = Q.nfcall(conn.query.bind(conn), "update ?? set `result` = ?, `time_used` = ?, `memory_used` = ? where `id` = ?",
                        [statusTableName, judgeResult, timeUsed, memoryUsed, statusId]);

                    queryQueue.push(updateStatus);

                    if (judgeResult == 0) {
                        //更新问题统计记录
                        var updateProblem = Q.nfcall(conn.query.bind(conn), "update ?? set `accept` = `accept` + 1 where `id` = ?",
                            [problemTableName, problemId]);
                        queryQueue.push(updateProblem);
                    }
                    return Q.all(queryQueue);
                })
                .then(function () {
                    var promise = Q.defer();
                    if(judgeResult == 0) { //如果结果是成功的话
                        //更新问题的记录
                        Q.nfcall(conn.query.bind(conn), "update ?? set `is_resolved` = '1' where `id` = ?",
                            [problemTableName, problemId])
                            .then(function (result) {
                                var affectedRow = result[0].affectedRows > 0;
                                //插入排名
                                var sql = "insert into ??(`user_id`, `problem_id`, `time_used`, `is_first`) values(?, ?, ?, ?)" +
                                    " ON DUPLICATE KEY UPDATE `time_used` = ?, `is_first` = ?";
                                return Q.nfcall(conn.query.bind(conn),
                                    sql,
                                    [ranklistTableName, userId, problemId, timeSpend, affectedRow, timeSpend, affectedRow])
                            })
                            .then(function() {
                                promise.resolve();
                            }, function(e) {
                                promise.reject(e);
                            });

                    } else {
                        var sql = "insert into ??(`user_id`, `problem_id`, `attempt`) values(?, ?, '1')" +
                            " ON DUPLICATE KEY UPDATE `attempt` = `attempt` + 1";
                        conn.query(sql, [ranklistTableName, userId, problemId], function (err) {
                            if (err) {
                                promise.reject(err);
                                return;
                            }
                            promise.resolve();
                        });
                    }
                    return promise;
                })
                .then(function () {
                    return Q.nfcall(conn.commit.bind(conn));
                })
                .fail(function (e) {
                    console.error(e);
                    conn.rollback(errorHandler);
                })
                .finally(function () {
                    conn.release();
                });
        });
    }


    pool.getConnection(function (err, conn) {
        if (err) {
            console.error(err);
            return;
        }
        work(conn);
    });


}

exports.resolve = resolveResult;