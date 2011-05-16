/**
 * Module dependencies.
 */

// try to use iconv

try {
	var Iconv  = require('iconv').Iconv;
} catch(e) {
	console.log('require iconv error:' + e);
	// fake a Iconv
	var Iconv = function(from, to) {
	};
	Iconv.prototype.convert = function(buffer) {
		return buffer;
	};
}

exports.Iconv = Iconv;
