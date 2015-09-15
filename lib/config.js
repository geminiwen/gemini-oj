var rabbitmq = {
    host: '192.168.99.100'
    , port: 5672
    , login: 'gemini'
    , password: '123456'
    , connectionTimeout: 10000
    , authMechanism: 'AMQPLAIN'
    , vhost: '/'
    , noDelay: true
    , ssl: { enabled : false
    }
};
var mysql = {
    "host": "192.168.99.100",
    "user": "root",
    "password": "123456",
    "database": "oj",
    "charset": "utf8mb4_unicode_ci"
};

exports.mq = rabbitmq;
exports.mysql = mysql;
