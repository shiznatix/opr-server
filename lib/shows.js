const config = require('../config/config.json');
const logger = require('./logger.js');
const db = require('./db.js');
const fs = require('fs');
const path = require('path');
const readDir = require('util').promisify(fs.readdir);

module.exports = {
	getShowEpisodes: function(dir) {
		return readDir(dir).then((files) => {
			const shows = [];
			const recursivePromises = [];

			files.forEach((file) => {
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
						filePath: fullPath,
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
			const episodesPromises = [];

			showFolders.forEach((showFolder) => {
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
		const scanDirs = [];

		config.dirs.forEach((dir) => {
			scanDirs.push(this.getShowsInDir(dir));
		});

		return Promise.all(scanDirs).then((dirData) => {
			const shows = [];

			// combine all folder arrays into 1 array
			dirData.forEach((show) => {
				shows.push(...show);
			});

			return shows;
		})
	},

	extractAllEpisodes: function(shows) {
		const episodes = [];
		const checkEpisodePromises = [];

		shows.forEach((show) => {
			show.episodes.forEach((episode) => {
				episodes.push(episode);
			});
		});

		return episodes;
	},

	checkAllEpisodesInDb: function(shows) {
		const checkEpisodes = [];

		shows.forEach((show) => {
			show.episodes.forEach((episode) => {
				checkEpisodes.push(this.checkEpisodeInDb(show.name, episode));
			});
		});

		return Promise.all(checkEpisodes);
	},

	checkEpisodeInDb: function(show, episode) {
		return db.getFromFilePath(episode.filePath).then((row) => {
			if (!row) {
				logger.debug(`Adding episode ${episode.filePath}`);
				return db.add(show, episode.fileName, episode.filePath);
			} else if (row.deleted) {
				logger.debug(`Undeleting episode ${row.id}`);
				return db.undelete(row.id);
			}
		});
	},

	checkDbEpisodes: function(episodes) {
		return db.getAllActive().then((rows) => {
			const deletePromises = [];

			rows.forEach((row) => {
				const pathInEpisodes = episodes.filter(function(e) {
					return e.filePath === row.filePath;
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

			return this.checkAllEpisodesInDb(shows).then(() => {
				return this.checkDbEpisodes(episodes)
			});
		});
	},

	scan: function() {
		logger.debug('Starting show episode scan');

		this.syncDatabase().catch((error) => {
			logger.error(error);
		}).then(() => {
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
		return db.selectRandom(showNames, amount).then((rows) => {
			if (!rows || 0 === rows.length) {
				throw new Error('No shows found for random');
			}

			rows.forEach((row) => {
				// set the last played time
				this.setLastPlayedTime(row.filePath);

				row.episodeName = row.fileName.slice(0, path.extname(row.fileName).length * -1);
			});

			return rows;
		});
	},

	setLastPlayedTime(filePath) {
		return db.setLastPlayedTime(filePath).catch((error) => {
			logger.error(error);
		});
	},

	getByCategories: function() {
		return db.getUniqueShowNames().then((showNames) => {
			const otherCategory = {
				categoryName: config.otherCategoryName,
				shows: [],
			};
			const categories = [];
			const addToCategory = (categoryName, showName) => {
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

			showNames.forEach((showName) => {
				let foundCategory = false;

				Object.entries(config.showCategories).forEach(([categoryName, definedShows]) => {
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
				categories.forEach((category) => {
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