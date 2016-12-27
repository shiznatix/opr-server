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
};