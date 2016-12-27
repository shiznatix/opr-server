const logger = require(`${__dirname}/logger.js`),
	_ = require('lodash'),
	knex = require('knex')({
		client: 'sqlite3',
		connection: {
			filename: `${__dirname}/../opr.sqlite`,
		},
		useNullAsDefault: true,
	}),
	Promise = require('bluebird');

function createDatabase() {
	const query = knex.schema.createTableIfNotExists('shows', (table) => {
		table.increments('id').primary();
		table.string('showName').notNullable();
		table.string('fileName').notNullable();
		table.string('path').notNullable();
		table.dateTime('addedTime').defaultTo(knex.fn.now()).notNullable();
		table.integer('playedCount').unsigned().defaultTo(0).notNullable();
		table.dateTime('lastPlayedTime').defaultTo(null);
		table.boolean('deleted').defaultTo(false).notNullable();
	});

	return query;
}

module.exports = {
	initDb: function() {
		const query = knex.select(1)
			.from('shows')
			.limit(1);

		return query.then(() => {
			return true;
		}).catch(() => {
			return createDatabase();
		});
	},

	getFromPath: function(episodePath) {
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

	getAllActive: function() {
		return knex.select('*')
			.from('shows')
			.where('deleted', false);
	},

	add: function(showName, fileName, episodePath) {
		const insertData = {
			showName: showName,
			fileName: fileName,
			path: episodePath,
			deleted: false,
		};

		return knex.insert(insertData).into('shows');
	},

	delete: function(id) {
		return knex('shows').where('id', id).update({
			deleted: true,
		});
	},

	undelete: function(id) {
		return knex('shows').where('id', id).update({
			deleted: false,
		});
	},

	selectRandom: function(showNames, amount) {
		let select = knex.select()
			.from('shows')
			.where('deleted', false)
			.orderByRaw('lastPlayedTime ASC, RANDOM()')
			.limit(amount);

		if (showNames.length > 0) {
			select.whereIn('showName', showNames);
		}

		return select;
	},

	getUniqueShowNames: function() {
		const sql = knex.select(knex.raw('DISTINCT showName'))
			.from('shows')
			.where('deleted', false);

		return sql.then((rows) => {
			let showNames = [];

			_.forEach(rows, (row) => {
				showNames.push(row.showName);
			});

			return showNames;
		});
	},
};