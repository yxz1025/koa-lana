/**
 *微信素材管理
 *
 */
const co = require('co');
const RedisClient = require('./redisclient');
const client = RedisClient.connection();
const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));

function Media() {
	this._type = new Map([['image', 'image/jpg']]);
};

//上传临时素材
/*
 *@param stream 文件流
 *@param filename 文件名称，支持jpg
 *@param type image,voice,video,thumb
 */
Media.prototype.upload = co.wrap(function*(stream, filename, type, appId) {
    let form_data = {
        media: {
            value: stream,
            options: {
                filename: filename,
                filelength: stream.length,
                "content-type": this._type.get(type)
            }
        }
    };
    //获取access_token
    let key = 'authorization_access_token';
    client.select(13);
    let authorization_info = yield client.hget(key, appId);
    if (authorization_info == null) {
    	return false;
    }
    let content = JSON.parse(authorization_info);
    var options = {
        url: 'https://api.weixin.qq.com/cgi-bin/media/upload?access_token='+content.authorizer_access_token + '&type=' + type,
        formData: form_data
    };
    let response = yield request.postAsync(options);
    if (response.statusCode == 200) {
    	let media = JSON.parse(response.body);
    	if (typeof(media.errcode) != "undefined") {
    		console.log(response.body);
    		return false;
    	}
    	return media;
    }
    return false;
});


module.exports = new Media();
