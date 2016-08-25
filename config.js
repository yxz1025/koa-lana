var Koa = require('koa');
var app = new Koa();
//全局配置文件
if (app.env == 'production') {
    var config = {
        'REDIS': {
            'RDS_PORT': '6379',
            'RDS_HOST': 'localhost',
            'RDS_AUTH': 'localhost'
        },
        AUTH_KEY: 'uAhnG_C=?:5w|QZ^*[$V1o~xcd+R8TkpzmKN;Ub(',
        API_HOST: 'http://localhost',
        component_config: {
            token: 'token',
            key: 'key',
            component_appid: 'component_appid',
            component_appsecret: 'component_appsecret'
        },

        QINIU: {
            accessKey: 'accessKey',
            secrectKey: 'secrectKey',
            bucket: 'bucket',
            domain: 'domain'
        },
        MQS: {
            accessKey: "accessKey",
            secrectKey: "secrectKey",
            accountId: "accountId",
            endpoint: "hangzhou-internal",
            url: "http://hangzhou-rest-internal.ons.aliyun.com",
            Custom_topic: "Custom_topic",
            Custom_Pid: "Custom_Pid"
        },
        Elastic: {
            host: "localhost",
            port: "9200"
        }
    };
} else if (app.env == 'development'){
    var config = {
        'REDIS': {
            'RDS_PORT': '6379',
            'RDS_HOST': 'localhost',
            'RDS_AUTH': 'localhost',
            'RDS_DB': 2
        },
        AUTH_KEY: 'uAhnG_C=?:5w|QZ^*[$V1o~xcd+R8TkpzmKN;Ub(',
        API_HOST: 'http://localhost',
        component_config: {
            token: 'token',
            key: 'key',
            component_appid: 'component_appid',
            component_appsecret: 'component_appsecret'
        },
        QINIU: {
            accessKey: 'accessKey',
            secrectKey: 'secrectKey',
            bucket: 'bucket',
            domain: '7xlhw2.media1.z0.glb.clouddn.com'
        },
        MQS: {
            accessKey: "accessKey",
            secrectKey: "secrectKey",
            accountId: "accountId",
            endpoint: "hangzhou-internal",
            url: "http://hangzhou-rest-internal.ons.aliyun.com",
            Custom_topic: "Custom_topic",
            Custom_Pid: "Custom_Pid"
        },
        Elastic: {
            host: "localhost",
            port: "9200"
        }
    };
}


module.exports = config;
