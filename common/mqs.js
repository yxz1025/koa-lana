const config = require('../config');
const CryptoA = require("crypto");
const Buffer = require("buffer");
const co = require('co');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));

//阿里云消息服务器
function MQS(){
	this._secretKey = config.MQS.secrectKey;
	this._accessKey = config.MQS.accessKey;
};

MQS.prototype.hmac_sha1 = function(text, encoding) {
    let hmacSHA1 = CryptoA.createHmac("sha1", this._secretKey);
    return hmacSHA1.update(text).digest(encoding);	
};

MQS.prototype.b64md5 = function (text) {
    let cryptoMD5 = CryptoA.createHash("md5");
    let md5HEX = cryptoMD5.update(text).digest("hex");
    return md5HEX;
};

MQS.prototype.sendMessage = co.wrap(function* (pid, topic, content) {
	let date = new Date().getTime();
	let NEWLINE="\n";
	let url = config.MQS.url + "/message/?topic=" + topic + "&time="+date+"&tag=http"+"&key=http";
	let signString = topic + NEWLINE + pid + NEWLINE + account.b64md5(content) + NEWLINE + date;
	let sign = this.hmac_sha1(signString, "base64");
	let options = {
	    url: url,
	    body: content,
	    headers: {
	        "Signature": sign,
	        "AccessKey": this._accessKey,
	        "ProducerID": pid,
	        "Content-Type": "text/html;charset=UTF-8"
	    }
	};
	let response = yield request.postAsync(options);
	if (response.statusCode == 200) {
		return true;
	}
	return false;	
});

module.exports = new MQS();