const config = require(`${__dirname}/../config/config.json`),
	logger = require(`${__dirname}/logger.js`),
	fs = require('fs'),
	readDir = Promise.promisify(fs.readdir);

class Browse {
	getFiles(dirPath) {
		readDir(dirPath).then((files) => {
			// TODO: Enrich to objects with isPlayable and other attributes set
			return files;
		});
	}
}

module.exports = Browse;