const router = require('koa-router')();
const packets = require('../model/packets');
const validator = require('validator');
const Koa = require('koa');
const app = new Koa();

router.get('/test', async function(ctx, next){
	let name = ctx.session.test || '';
	if (name == "") {
		ctx.session.test = "test";
		ctx.redirect('http://wx73b1627b88822372.client.gatao.cn/test/test');
	}
	ctx.state.test = name;
	await ctx.render('xigua');
});
module.exports = router;