const config = require(`${__dirname}/../config/config.json`),
	logger = require(`${__dirname}/logger.js`),
	db = require(`${__dirname}/db.js`),
	_ = require('lodash'),
	Promise = require('bluebird'),
	fs = require('fs'),
	readDir = Promise.promisify(fs.readdir);

class Shows {
	getShowEpisodes(dir) {
		return readDir(dir).then((files) => {
			let shows = [],
				recursivePromises = [];

			_.forEach(files, (file) => {
				if ('.' === file.charAt(0)) {
					return;
				}

				const fullPath = `${dir}/${file}`;

				if (fs.lstatSync(fullPath).isDirectory()) {
					const recursivePromise = this.getShowEpisodes(fullPath).then((data) => {
						return shows.push(...data);
					});

					recursivePromises.push(recursivePromise);
				} else {
					shows.push(fullPath);
				}
			});

			return Promise.all(recursivePromises)
				.then(() => {
					return shows;
				});
		});
	}

	getShowsInDir(dir) {
		return readDir(dir).then((showFolders) => {
			let episodesPromises = [];

			_.forEach(showFolders, (showFolder) => {
				if ('.' === showFolder.charAt(0)) {
					return;
				}

				const episodesPromise = this.getShowEpisodes(`${dir}/${showFolder}`).then((episodes) => {
					return {
						'name': showFolder,
						'episodes': episodes,
					};
				});

				episodesPromises.push(episodesPromise);
			});

			return Promise.all(episodesPromises);
		});
	}

	getAllShows() {
		let scanDirs = [];

		_.forEach(config.dirs, (dir) => {
			scanDirs.push(this.getShowsInDir(dir));
		});

		return Promise.all(scanDirs).then((dirData) => {
			let shows = [];

			// combine all folder arrays into 1 array
			_.forEach(dirData, (show) => {
				shows.push(...show);
			});

			return shows;
		})
	}

	extractAllEpisodes(shows) {
		let episodes = [],
			checkEpisodePromises = [];

		_.forEach(shows, (show) => {
			_.forEach(show.episodes, (episode) => {
				episodes.push(episode);
			});
		});

		return episodes;
	}

	checkAllEpisodesInDb(shows) {
		let checkEpisodes = [];

		_.forEach(shows, (show) => {
			_.forEach(show.episodes, (episode) => {
				checkEpisodes.push(this.checkEpisodeInDb(show.name, episode));
			});
		});

		return Promise.all(checkEpisodes);
	}

	checkEpisodeInDb(show, episodePath) {
		return db.getFromPath(episodePath).then((row) => {
			if (!row) {
				return db.add(show, episodePath);
			} else if (row.deleted) {
				return db.undelete(row.id);
			}
		});
	}

	checkDbEpisodes(episodes) {
		return db.getAllActive().then((rows) => {
			let deletePromises = [];

			_.forEach(rows, (row) => {
				if (episodes.indexOf(row.path) < 0) {
					// this was deleted from file system. delete from db now too
					logger.debug(`Deleting episode ${row.id}`);
					deletePromises.push(db.delete(row.id));
				}
			});

			return Promise.all(deletePromises);
		});
	}

	syncDatabase() {
		return this.getAllShows().then((shows) => {
			const episodes = this.extractAllEpisodes(shows);

			return this.checkAllEpisodesInDb(shows)
			.then(this.checkDbEpisodes(episodes))
			.then(() => {
				// TODO: Remove this, just for debugging
				// logger.debug(this.extractAllEpisodes(shows));
			});
		});
	}

	scan() {
		logger.debug('Starting show episode scan');

		this.syncDatabase().catch((error) => {
			logger.error(error);
		}).finally(() => {
			const restartMs = (1000 * 60 * 30);// 1 second * 60 * 30 = 30 minutes

			logger.debug(`Finished show episode scan, restarting in ${restartMs}ms`);

			setTimeout(() => {
				this.scan();
			}, restartMs);
		});
	}

	startScan() {
		this.scan();
	}

	random(showNames, amount) {
		return db.selectRandom(showNames, amount);
	}

	getByCategories() {
		return db.getUniqueShowNames().then((showNames) => {
			// TODO: finish building categories based on config
			let categories = [];
			console.log(showNames);
		});
	}
}

module.exports = Shows;