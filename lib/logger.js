module.exports = {
	error: function(logOut) {
		console.log(logOut);
	},

	info: function(logOut) {
		console.log(logOut);
	},

	warn: function(logOut) {
		console.log(logOut);
	},

	debug: function(logOut) {
		console.log(logOut);
	},

	dump: function(data) {
		console.log(require('util').inspect(data, false, null));
	},
};