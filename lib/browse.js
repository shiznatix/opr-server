const config = require(`${__dirname}/../config/config.json`),
	logger = require(`${__dirname}/logger.js`),
	_ = require('lodash'),
	Promise = require('bluebird'),
	fs = require('fs'),
	path = require('path'),
	readDir = Promise.promisify(fs.readdir);

module.exports = {
	getExtension: function(file) {
		let extension = path.extname(file);

		while ('.' === extension.charAt(0)) {
			extension = extension.substr(1);
		}

		return extension;
	},

	getFiles: function(dirPath) {
		return readDir(dirPath).then((files) => {
			let scrubFiles = [];

			_.forEach(files, (file) => {
				if ('.' === file.charAt(0)) {
					return;
				}

				const fullPath = `${dirPath}/${file}`,
					extension = this.getExtension(file);

				scrubFiles.push({
					name: file,
					fullPath: fullPath,
					isDir: fs.lstatSync(fullPath).isDirectory(),
					isPlayable: (config.playableExtensions.indexOf(extension) > -1),
				});
			});

			return scrubFiles;
		});
	},
};