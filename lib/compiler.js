/**
 *
 * Created by geminiwen on 15/9/14.
 */

var exec = require('child_process').exec;


var compiler = {
    c: function (inputFile, outputFile, completion) {
        var command = "gcc -Wall -pedantic -std=c99 " + inputFile + " -o " + outputFile;
        var childProcess = exec(command);
        childProcess.on("exit", function (code) {
            completion(code);
        })
    },
    cpp: function (inputFile, outputFile, completion) {
        var command = "gcc -Wall -pedantic -std=c++11 " + inputFile + " -o " + outputFile;
        var childProcess = exec(command);
        childProcess.on("exit", function (code) {
            completion(code);
        })
    },
    js: function (inputFile, outputFile, completion) {
        var command = "hashbangify " + inputFile + " && mv " + inputFile + " " + outputFile ;
        var childProcess = exec(command);
        childProcess.on("exit", function (code) {
            completion(code);
        })
    },
    java: function (inputFile, outputFile, completion) {
        var command = "javac " + inputFile ;
        var childProcess = exec(command);
        childProcess.on("exit", function (code) {
            completion(code);
        })
    }
};

module.exports = exports = compiler;