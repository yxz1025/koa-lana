const Promise = require('bluebird');

//普通post流转化为promise
var Tool = {
    convertPost: function(req) {
    	let post_data = "";
     	return new Promise(function(resolve, reject){
	        req.on('data', function(chunk) {
	            post_data += chunk;
	        });

	        req.on('end', function() {
	        	resolve(post_data);
	        });
    	});

    },
};
module.exports = Tool;
