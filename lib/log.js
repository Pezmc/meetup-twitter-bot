const colors = require('colors');

module.exports.error = function(message) {
	console.error('error'.red + ' ' + message);
}

module.exports.info = function(message) {
	console.log('info'.yellow + ' ' + message);
}

module.exports.debug = function(message) {
	console.log('debug'.grey + ' ' + message);
}

module.exports.success = function(message) {
	console.log('success'.green + ' ' + message);
}