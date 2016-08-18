/**
 * 将微信端发送的XML消息解析为JSON对象
 *
 * @param message
 * @returns {{}}
 */
 var parseMessage = function(message){
    var result = {};
    message.replace(/<xml>|<\/xml>/, '').replace(/<!\[CDATA\[(.*?)\]\]>/ig, '$1').replace(/<(\w+)>(.*?)<\/\1>/g, function(_, key, value) {
        key = key.replace(/(\w)/, function(str) {
            return str.toLowerCase();
        });
        result[key] = value;
    });

    return result;
 };

module.exports = parseMessage;
