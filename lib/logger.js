module.exports = {
	error: (logOut) => {
		console.log(logOut);
	},

	info: (logOut) => {
		console.log(logOut);
	},

	warn: (logOut) => {
		console.log(logOut);
	},

	debug: (logOut) => {
		console.log(logOut);
	},

	dump: (data) => {
		console.log(require('util').inspect(data, false, null));
	},
};