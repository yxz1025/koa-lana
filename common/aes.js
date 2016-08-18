const crypto = require('crypto');
var Buffer = require('buffer').Buffer;
const key  = new Buffer('1755c118e8859eb0','utf-8');
var Aes = {
  //加密
  encypt: function(data){
    let iv = '';
    let clearEncoding = 'utf8';
    let cipherEncoding = 'base64';
    let cipherChunks = [];
    let cipher = crypto.createCipheriv('aes-128-ecb', key, iv);
    cipher.setAutoPadding(true);

    cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
    cipherChunks.push(cipher.final(cipherEncoding));

    return cipherChunks.join('');
  },
  //解密
  decrypt: function(data){
    let iv = "";
    let clearEncoding = 'utf8';
    let cipherEncoding = 'base64';
    let cipherChunks = [];
    let decipher = crypto.createDecipheriv('aes-128-ecb', key, iv);
    decipher.setAutoPadding(true);

    cipherChunks.push(decipher.update(data, cipherEncoding, clearEncoding));
    cipherChunks.push(decipher.final(clearEncoding));

    return cipherChunks.join('');
  },
  base64_encode: function(data){
    let b = new Buffer(data);
    let s = b.toString('base64');
    return s;
  },
  base64_decode: function(data){
    let b = new Buffer(data,'base64');
    let s = b.toString();
    return s;
  }
};
module.exports = Aes;
