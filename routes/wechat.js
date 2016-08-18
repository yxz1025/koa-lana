// //微信响应主体文件
const router = require('koa-router')();
const parseMessage = require('../common/parseMessage');
const config = require('../config');
const WXBizMsgCrypt = require('wechat-crypto');
const middleware = require('../model/middleware');
const validator = require('validator');
const Aes = require('../common/aes');
const Tool = require('../common/tool');
const cryptor = new WXBizMsgCrypt(config.component_config.token, config.component_config.key, config.component_config.component_appid);

//第三方授权路径 /:appid/callback   /wechat/100234/callback
router.post('/:appid/callback', async function(ctx, next) {
    let post_data = "";
    let req = ctx.req;
    post_data = await Tool.convertPost(req);
    let xml = parseMessage(post_data);
    let signature = cryptor.getSignature(ctx.query.timestamp, ctx.query.nonce, xml.encrypt);
    if (ctx.query.msg_signature != signature) {
        ctx.body = 'Auth failed!'; // 指纹码不匹配时返回错误信息，禁止后面的消息接受及发送
    }
    let message = middleware.decryptXml(xml);
    let appid = ctx.params.appid;
    message.appId = appid;
    //发送消息队列
    switch (message.msgType) {
        case 'text':
            //测试
            if (message.toUserName == "gh_3c884a361561") {
                if (message.content == "TESTCOMPONENT_MSG_TYPE_TEXT") {
                    let text = middleware.text(message, message.content + "_callback");
                    let reply = middleware.encryptXml(text);
                    return ctx.body = reply;
                }
                let content = message.content;
                if (content.indexOf("QUERY_AUTH_CODE") != -1) {
                    ctx.body = "";
                    let code_li = content.split(":");
                    await middleware.customSend(message.fromUserName, code_li[1]);
                    return;
                }
            }
            let keywords = validator.trim(message.content).toLowerCase();
            let member_config = await middleware.getMemberConfig(message.toUserName, keywords);
            if (!member_config) {
                await middleware.sendMnsQuene(message);
                return ctx.body = "success";
            }else{
                 //匹配成功
                message.packetsId = parseInt(member_config.hongbaoId);
                message.keywords = keywords;
                await middleware.sendMnsQuene(message);

                let data = {
                    title: member_config.news_title || '点我领红包',
                    description: member_config.description || '第一轮红包雨开始了,手快有,手慢无！',
                    picurl: member_config.picurl || 'http://7xqomp.com2.z0.glb.qiniucdn.com/17269743.png'
                };
                let key = {
                    fromUserName: message.fromUserName,
                    toUserName: message.toUserName,
                    keywords: keywords,
                    appId: appid
                };
                key = JSON.stringify(key);
                key = Aes.encypt(key);
                key = Aes.base64_encode(key);

                //获取授权域名
                let auth_url = await middleware.packetDomain();
                data.url = "http://" + appid + "." + auth_url + "/redPackets/koulin?key=" + key;
                let news = middleware.news(message, [data]);
                let reply = middleware.encryptXml(news);
                ctx.body = reply; 
                return;              
            }
            break;
        case 'event':
            await middleware.sendMnsQuene(message);
            //测试专用
            if (message.toUserName == "gh_3c884a361561") {
                let text = middleware.text(message, message.event + "from_callback");
                let reply = middleware.encryptXml(text);
                ctx.body = reply;
                return;
            }
            break;
        default:
            await middleware.sendMnsQuene(message);
            ctx.body = "success";
            return;

    };
});
module.exports = router;
