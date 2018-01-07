const Promise = require('bluebird');

module.exports = {
	random: function(body) {
		return new Promise((accept, reject) => {
			const showNames = (Array.isArray(body.showNames) ? body.showNames : []),
				amount = Number(body.amount);

			if (NaN === amount) {
				return reject('Amount is not a number');
			}

			return accept({
				showNames: showNames,
				amount: amount,
			});
		});
	},

	setLastPlayedTime: function(body) {
		return new Promise((accept, reject) => {
			const filePaths = body.filePaths;

			if (!Array.isArray(filePaths)) {
				return reject('File paths is not an array');
			}

			return accept({
				filePaths: filePaths,
			});
		});
	},

	setFileNotPlayable: function(body) {
		return new Promise((accept, reject) => {
			const filePath = body.filePath;

			if (typeof filePath !== 'string') {
				return reject('File path is not a string');
			}

			return accept({
				filePath: filePath,
			});
		});
	},
};