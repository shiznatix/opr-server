const logger = require(`${__dirname}/logger.js`),
	knex = require('knex')({
		'client': 'sqlite3',
		'connection': {
			'filename': `${__dirname}/../opr.sqlite`,
		},
		'useNullAsDefault': true,
	}),
	Promise = require('bluebird');

function createDatabase() {
	const query = knex.schema.createTableIfNotExists('shows', (table) => {
		table.increments('id').primary();
		table.string('showName').notNullable();
		table.string('path').notNullable();
		table.dateTime('addedTime').defaultTo(knex.fn.now()).notNullable();
		table.integer('playedCount').unsigned().defaultTo(0).notNullable();
		table.dateTime('lastPlayedTime').defaultTo(null);
		table.boolean('deleted').defaultTo(false).notNullable();
	});

	return query;
}

module.exports = {
	'initDb': () => {
		const query = knex.select(1)
			.from('shows')
			.limit(1);

		return query.then(() => {
			return true;
		})
		.catch(() => {
			return createDatabase();
		});
	},

	'getFromPath': (episodePath) => {
		const query = knex.select('*')
			.from('shows')
			.where('path', episodePath)
			.limit(1);

		return query.then((row) => {
			if (!Array.isArray(row) || row.length < 1) {
				return null;
			}

			return row[0];
		});
	},

	'getAllActive': () => {
		return knex.select('*')
			.from('shows')
			.where('deleted', false);
	},

	'add': (showName, episodePath) => {
		const insertData = {
			'showName': showName,
			'path': episodePath,
			'deleted': false,
		};

		return knex.insert(insertData).into('shows');
	},

	'delete': (id) => {
		return knex('shows').where('id', id).update({
			'deleted': true,
		});
	},

	'undelete': (id) => {
		return knex('shows').where('id', id).update({
			'deleted': false,
		});
	},

	'selectRandom': (showNames, amount) => {
		let select = knex.select()
			.from('shows')
			.where('deleted', false)
			.orderByRaw('lastPlayedTime ASC, RANDOM()')
			.limit(amount);

		if (showNames) {
			select.whereIn('showName', showNames);
		}

		return select;
	},

	'getUniqueShowNames': () => {
		const sql = knex.select(knex.raw('DISTINCT showName'))
			.from('shows')
			.where('deleted', false);

		return sql;
	},
};