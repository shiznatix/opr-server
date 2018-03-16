const logger = require(`${__dirname}/logger.js`);
const shuffle = require('shuffle-array');
const knex = require('knex')({
	client: 'sqlite3',
	connection: {
		filename: `${__dirname}/../opr.sqlite`,
	},
	useNullAsDefault: true,
});

function createShowsTable() {
	return knex.schema.createTableIfNotExists('shows', (table) => {
		table.increments('id').primary();
		table.string('showName').notNullable();
		table.string('fileName').notNullable();
		table.string('filePath').notNullable();
		table.dateTime('addedTime').defaultTo(knex.fn.now()).notNullable();
		table.integer('playedCount').unsigned().defaultTo(0).notNullable();
		table.dateTime('lastPlayedTime').defaultTo(null);
		table.boolean('fileNotPlayable').defaultTo(false).notNullable();
		table.boolean('deleted').defaultTo(false).notNullable();
	});
}

function createPlayHistoryTable() {
	return knex.schema.createTableIfNotExists('playHistory', (table) => {
		table.increments('id').primary();
		table.string('showId').notNullable();
		table.dateTime('playedTime').defaultTo(knex.fn.now()).notNullable();
	});
}

module.exports = {
	initDb: function() {
		const query = knex.select(1)
			.from('shows')
			.limit(1);

		return query.then(() => {
			return true;
		}).catch(() => {
			return createShowsTable();
		}).then(() => {
			return knex.select(1)
				.from('playHistory')
				.limit(1);
		})
		.catch(() => {
			return createPlayHistoryTable();
		}).then(() => {
			return true;
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

		const pathIds = knex.select([
			'id',
			'filePath',
		]).from('shows').whereIn('filePath', filePaths);

		return pathIds.then((data) => {
			const historyInserts = [];

			data.forEach((row) => {
				const insert = knex.insert({
					showId: row.id,
				}).into('playHistory');
				
				historyInserts.push(insert);
			});

			return Promise.all(historyInserts);
		}).then(() => {
			return knex('shows').whereIn('filePath', filePaths).update({
				lastPlayedTime: knex.raw('datetime()'),
				playedCount: knex.raw('(playedCount + 1)'),
			})
		});
	},

	setFileNotPlayable: function(filePath) {
		return knex('shows').where('filePath', filePath).update({
			fileNotPlayable: true,
		});
	},

	fileConvertedToPlayable: function(id, filePath) {
		return knex('shows').where('id', id).update({
			filePath: filePath,
			fileNotPlayable: false,
			lastPlayedTime: null,
		});
	},

	getNotPlayableFiles: function() {
		return knex.select([
				'id',
				'filePath',
			])
			.from('shows')
			.where('fileNotPlayable', true)
			.andWhere('deleted', false);
	},

	selectRandom: function(showNames, amount) {
		// TODO! Move most of this logic out to the shows.js file!

		// if we don't care about show names, just get random shows!
		if (!showNames || !showNames.length) {
			return knex.select()
				.from('shows')
				.where('deleted', false)
				.andWhere('fileNotPlayable', false)
				.orderByRaw('lastPlayedTime ASC, RANDOM()')
				.limit(amount);
		}

		shuffle(showNames);

		// only get 1 of each show, unless amount > count of shows asked for
		if (showNames.length > amount) {
			const randomShowNames = [];

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

		// TODO, we should execute the promises 1 at a time so we get the previously
		// selected ids. If we have the same show more than once, we don't want to
		// get the exact same show out multiple times
		const randomShowPromises = [];

		showNames.forEach((showName) => {
			const select = knex.select()
				.from('shows')
				.where({
					deleted: false,
					showName: showName,
				})
				.orderByRaw('lastPlayedTime ASC')
				.limit(5);

			randomShowPromises.push(select);
		});

		return Promise.all(randomShowPromises).then((shows) => {
			const randomShows = [];

			shows.forEach((episodes) => {
				if (!Array.isArray(episodes) || episodes.length < 1) {
					return;
				}

				const episode = episodes[Math.floor(Math.random() * episodes.length)];

				randomShows.push(episode);
			});

			return randomShows;
		});
	},

	getUniqueShowNames: function() {
		const sql = knex.select(knex.raw('DISTINCT showName'))
			.from('shows')
			.where('deleted', false);

		return sql.then((rows) => {
			const showNames = [];

			rows.forEach((row) => {
				showNames.push(row.showName);
			});

			return showNames;
		});
	},
};
