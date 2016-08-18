const AliMNS = require("ali-mns");
const config = require('../config');
const co = require('co');

//阿里云消息服务器
function MNS(quene){
	this.account = new AliMNS.Account(config.MQS.accountId, config.MQS.accessKey, config.MQS.secrectKey);
	this.endpoint = config.MQS.endpoint;
	this.mq = new AliMNS.MQ(quene, this.account, this.endpoint);
};

//选择队列
MNS.prototype.sendMessage = co.wrap(function* (content) {
	let response = yield this.mq.sendP(content);
	return response;
});

module.exports = MNS;