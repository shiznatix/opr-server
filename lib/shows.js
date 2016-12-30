const config = require(`${__dirname}/../config/config.json`),
	logger = require(`${__dirname}/logger.js`),
	db = require(`${__dirname}/db.js`),
	_ = require('lodash'),
	Promise = require('bluebird'),
	fs = require('fs'),
	path = require('path'),
	readDir = Promise.promisify(fs.readdir);

module.exports = {
	getShowEpisodes: function(dir) {
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
					shows.push({
						fileName: file,
						path: fullPath,
					});
				}
			});

			return Promise.all(recursivePromises).then(() => {
				return shows;
			});
		});
	},

	getShowsInDir: function(dir) {
		return readDir(dir).then((showFolders) => {
			let episodesPromises = [];

			_.forEach(showFolders, (showFolder) => {
				if ('.' === showFolder.charAt(0)) {
					return;
				}

				const episodesPromise = this.getShowEpisodes(`${dir}/${showFolder}`).then((episodes) => {
					return {
						name: showFolder,
						episodes: episodes,
					};
				});

				episodesPromises.push(episodesPromise);
			});

			return Promise.all(episodesPromises);
		});
	},

	getAllShows: function() {
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
	},

	extractAllEpisodes: function(shows) {
		let episodes = [],
			checkEpisodePromises = [];

		_.forEach(shows, (show) => {
			_.forEach(show.episodes, (episode) => {
				episodes.push(episode);
			});
		});

		return episodes;
	},

	checkAllEpisodesInDb: function(shows) {
		let checkEpisodes = [];

		_.forEach(shows, (show) => {
			_.forEach(show.episodes, (episode) => {
				checkEpisodes.push({
					showName: show.name,
					episode: episode,
				});
			});
		});

		return Promise.each(checkEpisodes, (episode) => {
			return this.checkEpisodeInDb(episode.showName, episode.episode);
		});
	},

	checkEpisodeInDb: function(show, episode) {
		return db.getFromPath(episode.path).then((row) => {
			if (!row) {
				logger.debug(`Adding episode ${episode.path}`);
				return db.add(show, episode.fileName, episode.path);
			} else if (row.deleted) {
				logger.debug(`Undeleting episode ${row.id}`);
				return db.undelete(row.id);
			}
		});
	},

	checkDbEpisodes: function(episodes) {
		return db.getAllActive().then((rows) => {
			let deletePromises = [];

			_.forEach(rows, (row) => {
				const pathInEpisodes = episodes.filter(function(e) {
					return e.path === row.path;
				});

				if (0 === pathInEpisodes.length) {
					// this was deleted from file system. delete from db now too
					logger.debug(`Deleting episode ${row.id}`);
					deletePromises.push(db.delete(row.id));
				}
			});

			return Promise.all(deletePromises);
		});
	},

	syncDatabase: function() {
		return this.getAllShows().then((shows) => {
			const episodes = this.extractAllEpisodes(shows);

			return this.checkAllEpisodesInDb(shows)
			.then(this.checkDbEpisodes(episodes))
			.then(() => {
				// TODO: Remove this, just for debugging
				// logger.debug(this.extractAllEpisodes(shows));
			});
		});
	},

	scan: function() {
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
	},

	startScan: function() {
		this.scan();
	},

	random: function(showNames, amount) {
		return db.selectRandom(showNames, amount)
			.then((rows) => {
				_.forEach(rows, (row) => {
					row.episodeName = row.fileName.slice(0, path.extname(row.fileName).length * -1);
				});

				return rows;
			});
	},

	getByCategories: function() {
		return db.getUniqueShowNames().then((showNames) => {
			let otherCategory = {
					categoryName: config.otherCategoryName,
					shows: [],
				},
				categories = [],
				addToCategory = (categoryName, showName) => {
					const categoryExists = categories.filter(function(e) {
						return e.categoryName === categoryName;
					});

					if (0 === categoryExists.length) {
						categories.push({
							categoryName: categoryName,
							shows: [],
						});
					}

					const categoryIndex = categories.indexOf(categories.find((e) => {
						return e.categoryName === categoryName;
					}));

					categories[categoryIndex].shows.push(showName);
				};

			_.forEach(showNames, (showName) => {
				let foundCategory = false;

				_.forOwn(config.showCategories, (definedShows, categoryName) => {
					if (definedShows.indexOf(showName) > -1) {
						foundCategory = true;
						addToCategory(categoryName, showName);
						return false;
					}
				});

				if (!foundCategory) {
					otherCategory.shows.push(showName);
				}
			});

			// sort arrays
			if (categories.length > 0) {
				// sort categories by name
				categories.sort((a, b) => {
					return ((a.categoryName < b.categoryName) ? -1 : ((a.categoryName > b.categoryName) ? 1 : 0));
				});

				// sort shows by name
				_.forEach(categories, (category) => {
					category.shows.sort((a, b) => {
						return ((a < b) ? -1 : ((a > b) ? 1 : 0));
					});
				});
			}

			// always add otherCategory to end of array
			if (otherCategory.shows.length > 0) {
				categories.push(otherCategory);
			}

			return categories;
		});
	},
};