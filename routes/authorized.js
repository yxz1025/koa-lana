const router = require('koa-router')();
const parseMessage = require("../common/parseMessage");
const config = require("../config");
const WXBizMsgCrypt = require('wechat-crypto');
const component_weixin = require('../model/component_weixin');
const RedisClient = require('../common/redisclient');
const client = RedisClient.connection();
const Tool = require('../common/tool');
//推送component_verify_ticket协议
//授权更新
router.post('/notice', async function(ctx, next) {
    let post_data = "";
    let req = ctx.req;
    post_data = await Tool.convertPost(req);
    //微信揭秘库
    let cryptor = new WXBizMsgCrypt(config.component_config.token, config.component_config.key, config.component_config.component_appid);
    let xml = parseMessage(post_data);
    let message = cryptor.decrypt(xml.encrypt);
    //保存verify_ticket
    let key = 'component_verify_ticket';
    let obj = parseMessage(message.message);

    client.select(13);
    if (obj.infoType == 'component_verify_ticket') {
        client.setex(key, 600, JSON.stringify(obj));
    }

    if (obj.infoType == 'authorized' && obj.authorizerAppid == 'wx570bc396a51b8ff8') {
        client.setex('authorized_wx570bc396a51b8ff8', obj.authorizationCodeExpiredTime, obj.authorizationCode);
    }

    //授权成功通知
    if (obj.infoType == "unauthorized") {
        await client.hdel('authorization_access_token', obj.authorizerAppid);
    }
    ctx.body = "success";
});

//授权回调地址
router.get('/info', async function(ctx, next) {
    let authorization_code = ctx.query.auth_code || '';
    let userToken = ctx.cookies.get('userToken');
    if (authorization_code == '' || typeof(authorization_code) == 'undefined') {
        ctx.throw('authorization_code is illegue');
    }

    //获取调用接口凭证
    let member = await component_weixin.getAuthInfo(authorization_code);
    if (!member) {
        await ctx.render('error');
    }

});

//授权入口地址
router.get('/weixin', async function(ctx, next) {
    let host = ctx.host;
    let pre_code = await component_weixin.getPreAuthCode();
    if (!pre_code) {
        ctx.throw('weixin callback_url is error');
    }
    let location_url = 'https://mp.weixin.qq.com/cgi-bin/componentloginpage?component_appid=' + config.component_config.component_appid + '&pre_auth_code=' + pre_code + '&redirect_uri=';
    let callback_url = 'http://' + host + '/authorized/info';
    ctx.redirect(location_url + callback_url);
});

//获取component_access_token
router.get('/get_component_token', async function(ctx, next) {
    let access_token = await component_weixin.getComponentToken();
    if (!access_token) {
        ctx.throw('access_token is error');
    }
    ctx.body = access_token;
});
module.exports = router;
