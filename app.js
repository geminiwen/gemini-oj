var daemon = require('daemon');
var grunner = require("./lib/grunner");
var fs = require("fs");
var resolve = require("./lib/result").resolve;

var amqp = require('amqp');
var config = require("./lib/config").mq;
var compiler = require("./lib/compiler");

var connection = amqp.createConnection(config, {defaultExchangeName: "amq.direct"});

var grunnerQueueOptions = {
    durable: true,
    autoDelete: false
};

var queueWork = function queueWork (message, headers, deliveryInfo, messageObject) {
    var sourceFile = message.sourceFile;      //source file
    var execFile = message.execFile;    //compiled file
    var language = message.language;
    var inputFile = message.inputFile;
    var outputFile = message.outputFile;
    var sampleFile = message.sampleFile || outputFile;
    var timeLimit = message.timeLimit || 1000;
    var memoryLimit = message.memoryLimit || 64 * 1024;
    var uid = message.uid || process.getuid();
    var args = message.args;

    function compileComplete(errcode) {
        if(errcode == 0) {
            var fin = fs.openSync(inputFile, "r");
            var fout = fs.openSync(outputFile, "w+");
            var fsample = fs.openSync(sampleFile, "r");

            //build process object
            var process = {
                path: execFile,
                fin: fin,
                fout: fout,
                timeLimit: timeLimit,
                memoryLimit: memoryLimit,
                uid: uid,
                args: args || []
            };
            grunner.run(process, function (result) {
                console.dir(result);
                var retCode = result['judgeResult'];
                if (retCode == 0) {
                    retCode = grunner.check(fsample, fout);
                    result['judgeResult'] = retCode;
                }
                resolve(message, result);
            });

        } else {
            result = {'judgeResult' : 7};
            resolve(message, result);
        }

    }
    var language = language.toLocaleLowerCase();
    switch (language) {
        case "c": {
            compiler.c(sourceFile, execFile, compileComplete);
            break;
        }
        case "cpp": {
            compiler.cpp(sourceFile, execFile, compileComplete);
            break;
        }
        case "javascript": {
            compiler.js(sourceFile, execFile, compileComplete);
            break;
        }
        case "java": {
            compiler.java(sourceFile, execFile, compileComplete);
            break;
        }
        default : {
            resolve(message, {'judgeResult' : 7});
            break;
        }
    }

};


var onConnected = function onConnected() {
    connection.queue("grunner", grunnerQueueOptions, function(q) {
        q.subscribe(queueWork);
    });
};

connection.on("ready", onConnected);

daemon();
