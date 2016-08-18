const router = require('koa-router')();
const config = require('../config');
const moment = require('moment');
//七牛获取uptoken
//七牛云存储
const qiniu = require('qiniu');

//七牛key
qiniu.conf.ACCESS_KEY = config.QINIU.accessKey;
qiniu.conf.SECRET_KEY = config.QINIU.secrectKey;

router.get('/qiniu/upToken', async function(ctx, next) {

    let myUptoken = new qiniu.rs.PutPolicy(config.QINIU.bucket);
    let token = myUptoken.token();
    moment.locale('en');
    let currentKey = moment(new Date()).format('YYYYMMDDHHmmss');
    ctx.set("Cache-Control", "max-age=0, private, must-revalidate");
    ctx.set("Pragma", "no-cache");
    ctx.set("Expires", 0);
    if (token) {
        ctx.body = {
            uptoken: token,
            sava_key :currentKey
        };
    }

});
module.exports = router;