const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')();
const views = require('koa-views');
const convert = require('koa-convert');
const json = require('koa-json');
const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser')();
const logger = require('koa-logger');
const session = require('koa-session-redis');
const config = require('./config');


const index = require('./routes/index');
const authorized = require('./routes/authorized');
const wechat = require('./routes/wechat');
const upload = require('./routes/upload');
const user = require('./routes/user');

//生产环境启动pm2 start ./bin/run
// middlewares
app.use(convert(bodyparser));
app.use(convert(json()));
app.use(convert(logger()));
app.use(require('koa-static')(__dirname + '/public'));

app.use(views(__dirname + '/views', {
  map: {
    html: 'ejs'
  }
}));
//app.set('view engine', 'html');
//设置cookie迷药
app.keys = ['koa-packets'];
app.use(session({
  store: {
    host: config.REDIS.RDS_HOST,
    port: config.REDIS.RDS_PORT,
    ttl: 60*60*24,
    options: {
      auth_pass: config.REDIS.RDS_AUTH
    },
    db: 0
  },
  key: 'koa:key'
}));

// logger
app.use(async(ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

router.use('/', index.routes(), index.allowedMethods());
router.use('/authorized', authorized.routes(), authorized.allowedMethods());
router.use('/wechat', wechat.routes(), wechat.allowedMethods());
router.use('/upload', upload.routes(), upload.allowedMethods());
router.use('/user', user.routes(), user.allowedMethods());

app.use(router.routes(), router.allowedMethods());
// response

app.on('error', function(err, ctx) {
  console.log(err)
  logger.error('server error', err, ctx);
});


module.exports = app;
