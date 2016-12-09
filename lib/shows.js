const Promise = require('bluebird');

module.exports = {
	'getByCategories': function(path) {
		return new Promise((accept, reject) => {
			return accept([
				{
					'name': 'cat1',
					'shows': [
						{
							'id': '1',
							'name': 'Beans',
						},
						{
							'id': '2',
							'name': 'WQhoa',
						},
					],
				},
				{
					'name': 'cat2',
					'shows': [
						{
							'id': '3',
							'name': '222Beans',
						},
						{
							'id': '4',
							'name': 'WQh 23 sdfoa',
						},
					],
				},
			]);
		});
	},
};