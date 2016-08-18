const WXBizMsgCrypt = require('wechat-crypto');
const parseMessage = require("../common/parseMessage");
const config = require('../config');
const ejs = require('ejs');
const fs = require('fs');
const co = require('co');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require("request"));
const cryptor = new WXBizMsgCrypt(config.component_config.token, config.component_config.key, config.component_config.component_appid);
const messageTpl = fs.readFileSync(__dirname + '/message.ejs', 'utf-8');
const wrapTpl = fs.readFileSync(__dirname + '/wraptpl.ejs', 'utf-8');
const RedisClient = require('../common/redisclient');
const client = RedisClient.connection();
const component_weixin = require('../model/component_weixin');

//引入消息中间件
const MNS = require('../common/mns');
//普通消息
const mns_event = new MNS('event-message-quene');

//转发中间件
var MiddleWare = {

    //xml 原始需要加密的
    encryptXml: function(xml) {
        let wrap = {};
        wrap.encrypt = cryptor.encrypt(xml);
        wrap.nonce = parseInt((Math.random() * 100000000000), 10);
        wrap.timestamp = new Date().getTime();
        wrap.signature = cryptor.getSignature(wrap.timestamp, wrap.nonce, wrap.encrypt);
        let output = ejs.render(wrapTpl, wrap);
        return output;
    },

    //解密消息体
    decryptXml: function(xml) {
        //获取加密的encrypt
        let message = cryptor.decrypt(xml.encrypt);
        //解析后的消息
        let obj = parseMessage(message.message);
        return obj;
    },

    //文本消息
    text: function(message, data) {
        let reply = {
            toUserName: message.fromUserName,
            fromUserName: message.toUserName,
            createTime: new Date().getTime(),
            msgType: 'text',
            content: data
        };
        let output = ejs.render(messageTpl, reply);
        return output;
    },

    //图文消息
    news: function(message, data) {
        let reply = {
            toUserName: message.fromUserName,
            fromUserName: message.toUserName,
            createTime: new Date().getTime(),
            msgType: 'news',
            content: data
        };
        let output = ejs.render(messageTpl, reply);
        return output;
    },

    //关注事件
    subscribe: co.wrap(function*(toUserName, fromUserName) {
        let subscribe_key = 'Gift:SubCribe:Client:' + toUserName;
        client.select(6);
        yield client.hset(subscribe_key, fromUserName, 1);
        return true;
    }),

    //取消关注
    unsubscribe: co.wrap(function*(toUserName, fromUserName) {
        let subscribe_key = 'Gift:SubCribe:Client:' + toUserName;
        client.select(6);
        yield client.hset(subscribe_key, fromUserName, 0);
        return true;
    }),

    //获取授权unionid
    isexist_token: co.wrap(function*(token) {
        let key = 'component:auth_token';
        client.select(1);
        let auth_token = yield client.hget(key, token);
        return auth_token;
    }),

    //公众号基本配置
    getMemberConfig: co.wrap(function*(toUserName, content) {
        //判断是否为关键字
        let key = 'hongbao:TokenKeyWords:' + toUserName;
        client.select(14);
        let memberConfig = yield client.hget(key, content);
        if (memberConfig) {
            let parseJson = JSON.parse(memberConfig);
            return parseJson;
        }
        return false;
    }),

    //发送消息信息
    sendMnsQuene: co.wrap(function*(message){
        //关注事件写入redis
        if (message.msgType == "event" && message.event == "subscribe") {
            yield this.subscribe(message.toUserName, message.fromUserName);
        }
        //将消息放入队列
        message.createTime = message.createTime * 1000;
        let response = yield mns_event.sendMessage(JSON.stringify(message));
        return response;
    }),

    //关键字匹配
    keyWordPattern: function(src, desc) {
        let status = false;
        if (src instanceof Array) {
            src.forEach(function(item, index) {
                if (item.toLowerCase() == desc) {
                    status = true;
                }
            });
            return status;
        } else {
            return (src.toLowerCase() == desc) ? true : false;
        }
    },
    //获取授权域名
    packetDomain: co.wrap(function*() {
        client.select(14);
        let key = "hongbao:auth_url";
        let response = yield client.get(key);
        return response;
    }),
    //获取授权成功code
    testAuthorizeCode: co.wrap(function*() {
        client.select(2);
        let auth_code = yield client.get('authorized_wx570bc396a51b8ff8');
        return auth_code;
    }),
    //客服接口发送消息
    customSend: co.wrap(function*(fromUserName, auth_code) {
        let component_access_token = yield component_weixin.getComponentToken();
        let authorized = yield component_weixin.getQueryAuth(auth_code, component_access_token);
        let access_token = authorized.authorization_info.authorizer_access_token;
        let url = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=' + access_token;
        let body = {
            touser: fromUserName,
            msgtype: 'text',
            text: {
                content: auth_code + '_from_api'
            }
        }
        let args = {
            url: url,
            form: JSON.stringify(body)
        };
        let response = yield request.postAsync(args);
        if (response.statusCode == 200) {
            return 'success';
        }
        return 'error';
    }),
};
module.exports = MiddleWare;

/**
 * 类扩展工具函数
 *
 * @param obj
 * @param obj2
 * @returns {*}
 */
function extend(obj, obj2) {
    for (var key in obj2) {
        if (obj2.hasOwnProperty(key)) {
            obj[key] = obj2[key];
        }
    }

    return obj;
}
