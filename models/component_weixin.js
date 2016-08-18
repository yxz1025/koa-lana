const co = require('co');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require("request"));
const RedisClient = require('../common/redisclient');
const client = RedisClient.connection();
const config = require("../config");
const moment = require('moment');
moment.locale('zh-cn'); //使用中文
//第三方平台授权功能
var ComponentWeixin = {
    //获取component_token
    /*
    *{
        "component_access_token":"61W3mEpU66027wgNZ_MhGHNQDHnFATkDa9-2llqrMBjUwxRSNPbVsMmyD-yq8wZETSoE5NQgecigDrSHkPtIYA", 
    *   "expires_in":7200
        }
    */
    getComponentToken: co.wrap(function*() {
        let key = 'component_access_token';
        let key_ticket = 'component_verify_ticket';
        let body = {
            component_appid: config.component_config.component_appid,
            component_appsecret: config.component_config.component_appsecret
        };
        client.select(13);
        let token = yield client.get(key);
        if (token) {
            return token;
        }
        let ticket = yield client.get(key_ticket);
        if (ticket) {
            let obj = JSON.parse(ticket);
            body.component_verify_ticket = obj.componentVerifyTicket;
            let args = {
                url: 'https://api.weixin.qq.com/cgi-bin/component/api_component_token',
                form: JSON.stringify(body)
            };
            let response = yield request.postAsync(args);
            if (response.statusCode == 200) {
                let data = response.body;
                let component = JSON.parse(data);
                client.select(13);
                yield client.setex(key, component.expires_in, component.component_access_token);
                return component.component_access_token;
            }
        }
        return false;
    }),

    //获取预授权码pre_auth_code
    getPreAuthCode: co.wrap(function*() {
        let component_access_token = yield this.getComponentToken();
        let key = 'pre_auth_code';
        let body = {
            component_appid: config.component_config.component_appid
        };
        let args = {
            url: 'https://api.weixin.qq.com/cgi-bin/component/api_create_preauthcode?component_access_token=' + component_access_token,
            form: JSON.stringify(body)
        };
        let response = yield request.postAsync(args);
        if (response.statusCode == 200) {
            let data = response.body;
            let obj = JSON.parse(data);
            return obj.pre_auth_code;
        }
        return false;
    }),

    //使用授权码换取公众号的接口调用凭据和授权信息
    getQueryAuth: co.wrap(function*(authorization_code, component_access_token) {
        let body = {
            component_appid: config.component_config.component_appid,
            authorization_code: authorization_code
        };
        let key = 'authorization_access_token';
        let args = {
            url: 'https://api.weixin.qq.com/cgi-bin/component/api_query_auth?component_access_token=' + component_access_token,
            form: JSON.stringify(body)
        };
        let response = yield request.postAsync(args);
        if (response.statusCode == 200) {
            let data = response.body;
            let obj = JSON.parse(data);
            let authorizer_appid = obj.authorization_info.authorizer_appid;
            if (authorizer_appid != "wx570bc396a51b8ff8") {
                //保存授权方access_token
                client.select(13);
                let access_token = {
                    authorizer_appid: obj.authorization_info.authorizer_appid,
                    authorizer_access_token: obj.authorization_info.authorizer_access_token,
                    expires_in: 7200,
                    authorizer_refresh_token: obj.authorization_info.authorizer_refresh_token,
                    ctime: moment().unix()
                };
                yield client.hset(key, obj.authorization_info.authorizer_appid, JSON.stringify(access_token));
            }
            return obj;
        }
        return false;
    }),

    //获取授权方的公众号帐号基本信息
    getAuthInfo: co.wrap(function*(authorization_code) {
        let component_access_token = yield this.getComponentToken();
        let authorization = yield this.getQueryAuth(authorization_code, component_access_token);
        let body = {
            component_appid: config.component_config.component_appid,
            authorizer_appid: authorization.authorization_info.authorizer_appid
        };
        let args = {
            url: 'https://api.weixin.qq.com/cgi-bin/component/api_get_authorizer_info?component_access_token=' + component_access_token,
            form: JSON.stringify(body)
        };
        let response = yield request.postAsync(args);
        if (response.statusCode == 200) {
            let data = response.body;
            let obj = JSON.parse(data);
            return obj;
        }
        return false;
    }),

    //获取公众账号基本信息
    getAuthorizerMemberInfo: co.wrap(function*(authorizer_appid) {
        let component_access_token = yield this.getComponentToken();
        let body = {
            component_appid: config.component_config.component_appid,
            authorizer_appid: authorizer_appid
        };
        let args = {
            url: 'https://api.weixin.qq.com/cgi-bin/component/api_get_authorizer_info?component_access_token=' + component_access_token,
            form: JSON.stringify(body)
        };
        let response = yield request.postAsync(args);
        if (response.statusCode == 200) {
            let data = response.body;
            let obj = JSON.parse(data);
            return obj;
        }
        return false;
    }),

    //代理公众号实现业务----用户数据统计
    /**
     * 获取用户增减数据
     * @authorizer_appid 授权公众号appid
     * @begin_date 开始时间 2014-12-12 maxdate: 7
     * @end_date 结束时间 2014-12-15
     * @type getusercumulate 获取累计用户数据
     * @type getusersummary 获取用户增减数据
     */
    getUserSummary: co.wrap(function*(type, authorizer_appid, begin_date, end_date) {
        //获取access_token
        let key = 'authorization_access_token';
        client.select(13);
        let authorization_info = yield client.hget(key, authorizer_appid);
        if (authorization_info) {
            let content = JSON.parse(authorization_info);
            let body = {
                begin_date: begin_date,
                end_date: end_date
            };
            let args = {
                url: 'https://api.weixin.qq.com/datacube/'+ type + '?access_token=' + content.authorizer_access_token,
                form: JSON.stringify(body)
            };
            let response = yield request.postAsync(args);
            if (response.statusCode == 200) {
                let data = response.body;
                let obj = JSON.parse(data);
                return obj;
            }
        }
        return false;
    }),

    /**
    *消息统计接口
    *1、获取消息发送概况数据 getupstreammsg
    *2、获取消息分送分时数据 getupstreammsghour
    *3、获取消息发送周数据（getupstreammsgweek）
    *4、获取消息发送月数据（getupstreammsgmonth）
    *5、获取消息发送分布数据（getupstreammsgdist）
    *5、获取消息发送分布周数据（getupstreammsgdistweek）
    *6、获取消息发送分布月数据（getupstreammsgdistmonth）
    */
    getMessageCumulate: co.wrap(function*(type, authorizer_appid, begin_date, end_date) {
        let key = 'authorization_access_token';
        client.select(13);
        let authorization_info = yield client.hget(key, authorizer_appid);
        if (authorization_info) {
            let content = JSON.parse(authorization_info);
            let body = {
                begin_date: begin_date,
                end_date: end_date
            };
            let args = {
                url: 'https://api.weixin.qq.com/datacube/' + type + '?access_token=' + content.authorizer_access_token,
                form: JSON.stringify(body)
            };
            let response = yield request.postAsync(args);
            if (response.statusCode == 200) {
                let data = response.body;
                let obj = JSON.parse(data);
                return obj;
            }
        }
        return false;       
    }),

    /*
    * 图文分享数据
    * 1、获取图文群发每日数据（getarticlesummary）
    * 2、获取图文群发总数据（getarticletotal）
    * 3、获取图文统计数据（getuserread）
    * 4、获取图文统计分时数据（getuserreadhour）
    * 5、获取图文分享转发数据（getusershare）
    * 6、获取图文分享转发分时数据（getusersharehour）
    */
    getArticleCumulate: co.wrap(function*(type, authorizer_appid, begin_date, end_date) {
        let key = 'authorization_access_token';
        client.select(13);
        let authorization_info = yield client.hget(key, authorizer_appid);
        if (authorization_info) {
            let content = JSON.parse(authorization_info);
            let body = {
                begin_date: begin_date,
                end_date: end_date
            };
            let args = {
                url: 'https://api.weixin.qq.com/datacube/' + type + '?access_token=' + content.authorizer_access_token,
                form: JSON.stringify(body)
            };
            let response = yield request.postAsync(args);
            if (response.statusCode == 200) {
                let data = response.body;
                let obj = JSON.parse(data);
                return obj;
            }
        }
        return false;       
    }),
};
module.exports = ComponentWeixin;
