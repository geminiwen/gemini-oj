var grunner = require("./lib/grunner");
var fs = require("fs");
var resolve = require("./lib/result").resolve;

var amqp = require('amqp');
var config = require("./lib/config");
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
                uid: uid
            };


            var result = grunner.run(process);
            var retCode = result['judgeResult'];

            if (retCode == 0) {
                retCode = grunner.check(fsample, fout);
                result['judgeResult'] = retCode;
            }

        } else {
            result = {'judgeResult' : 7};
        }
        resolve(message, result);
    }

    switch (language.toLocaleLowerCase()) {
        case "c": {
            compiler.c(sourceFile, execFile, compileComplete);
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