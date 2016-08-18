const router = require('koa-router')();
const validator = require('validator');
const Koa = require('koa');
const app = new Koa();
const component_weixin = require('../model/component_weixin');
const moment = require('moment');
moment.locale('zh-cn'); //使用中文

router.use(async function(ctx, next) {
	ctx.state.userToken = ctx.cookies.get('userToken');
    if (!ctx.state.userToken) {
    	ctx.redirect('/');
    	return
    }
	let userinfo = ctx.cookies.get('userinfo');
	ctx.state.userinfo = JSON.parse(userinfo);
    await next();
});

router.get('/member', async function(ctx, next) {
    await ctx.render('views/add');
});

router.get('/userinfo', async function(ctx, next) {
    await ctx.render('views/userInfo');
});

//获取公众号列表
router.post('/memberlist', async function(ctx, next){

});

//退出登录
router.get('/signout', async function(ctx, next){
	ctx.cookies.set('userinfo', null, {maxAge:0});
	ctx.cookies.set('userToken', null,{maxAge:0});
	ctx.redirect('/');
});
module.exports = router;