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
    }
};

module.exports = exports = compiler;