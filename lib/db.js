const logger = require(`${__dirname}/logger.js`),
	_ = require('lodash'),
	shuffle = require('shuffle-array'),
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
		table.string('filePath').notNullable();
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

	getFromFilePath: function(episodePath) {
		const query = knex.select('*')
			.from('shows')
			.where('filePath', episodePath)
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
			filePath: episodePath,
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

	setLastPlayedTime: function(filePaths) {
		filePaths = (Array.isArray(filePaths) ? filePaths : [filePaths]);

		return knex('shows').whereIn('filePath', filePaths).update({
			lastPlayedTime: knex.raw('datetime()'),
		});
	},

	selectRandom: function(showNames, amount) {
		// TODO! Move most of this logic out to the shows.js file!

		// if we don't care about show names, just get random shows!
		if (!showNames || !showNames.length) {
			return knex.select()
				.from('shows')
				.where('deleted', false)
				.orderByRaw('lastPlayedTime ASC, RANDOM()')
				.limit(amount);
		}

		shuffle(showNames);

		// only get 1 of each show, unless amount > count of shows asked for
		if (showNames.length > amount) {
			let randomShowNames = [];

			for (let i = 0; i < amount; i++) {
				randomShowNames[i] = showNames[i];
			}

			showNames = randomShowNames;
		} else if (showNames.length < amount) {
			// if we have less shows than our amount, increase size till we are ok
			const missingShowsCount = amount - showNames.length;

			for (let i = 0; i < missingShowsCount; i++) {
				showNames.push(showNames[Math.floor(Math.random() * showNames.length)]);
			}
		}

		// loop over each show name and get 1 random show out at a time
		// save the id of each episode picked out and the the next query
		// should ignore the ids that were already picked out
		_.forEach(showNames, (showName) => {});

		let select = knex.select()
			.from('shows')
			.where('deleted', false)
			.whereIn('showName', showNames)
			.orderByRaw('lastPlayedTime ASC, RANDOM()')
			.limit(amount);

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