function now() {
	const now = new Date();
	const zeros = (num) => {
		return num < 10 ? `0${num}` : num;
	};
	const date = `${zeros(now.getMonth() + 1)}-${zeros(now.getDate())}`;
	const time = `${zeros(now.getHours())}:${zeros(now.getMinutes())}:${zeros(now.getSeconds())}`;

	return `${date}.${time}`;
}

module.exports = {
	error: function(logOut) {
		console.log(`${now()} ${logOut}`);
	},

	info: function(logOut) {
		console.log(`${now()} ${logOut}`);
	},

	warn: function(logOut) {
		console.log(`${now()} ${logOut}`);
	},

	debug: function(logOut) {
		console.log(`${now()} ${logOut}`);
	},

	dump: function(data) {
		console.log(require('util').inspect(data, false, null));
	},
};
