var config = {
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

module.exports = exports = config;
