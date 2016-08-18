const router = require('koa-router')();
const validator = require('validator');
const parseMessage = require('../common/parseMessage');
/* GET home page. */
router.get('/', async function(ctx, next) {
    let host = ctx.host;
    await ctx.render('index');
});

router.post('user/postsign', async function(ctx, next) {
    var args = {
    	userName: ctx.request.body.userName || '',
    	userPass: ctx.request.body.userPass || '',
    	tel: ctx.request.body.tel || '',
    	InvitationUserId: ctx.request.body.InvitationUserId || '',
    	smsCode: ctx.request.body.smsCode || '',
    }
	ctx.body = args;
});
module.exports = router;
