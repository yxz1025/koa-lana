//redis连接池
const Redis = require('ioredis');
const Config = require('../config');

function RedisClient(){
    let args = {
        port: Config.REDIS.RDS_PORT,
        host: Config.REDIS.RDS_HOST,
        family: 4,
        password: Config.REDIS.RDS_AUTH,
        db: 13
    };
    this.client = new Redis(args);
};

RedisClient.prototype.connection = function() {
    return this.client;
};
module.exports = new RedisClient();