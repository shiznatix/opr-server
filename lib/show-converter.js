const db = require('./db.js'),
	logger = require('./logger.js'),
	Promise = require('bluebird'),
	spawn = require('child_process').spawn,
	fs = require('fs');

module.exports = {
	convert: function(file) {
		// TODO actually split this into real functions...
		return new Promise((accept) => {
			const fileId = file.id;
			const sourcePath = file.filePath;
			const origFileName = sourcePath.split('/').pop().replace(/\.[^/.]+$/, '');
			const convertFileName = `${origFileName}.mkv`;
			const convertPath = `/tmp/${convertFileName}`;
			const finalPath = sourcePath.split('/').slice(0, -1).join('/') + `/${convertFileName}`;

			logger.debug(`Converting ${sourcePath}`);

			const convertCommand = spawn('avconv', [
				'-y', '-i', sourcePath, convertPath,
			]);

			convertCommand.stderr.on('data', (data) => {
				logger.debug(`Converting: ${data.toString('utf8')}`);
			});

			convertCommand.on('exit', (code) => {
				logger.debug(`Converting ${sourcePath} finished with code ${code}`);

				if (0 !== code) {
					logger.debug(`Converter exited with non 0 code for ${sourcePath}`);
					return accept();
				}

				if (!fs.existsSync(convertPath)) {
					logger.debug('Convert path file does not exist');
					return accept();
				}

				let sourceWasDeleted = false;

				// delete the final destination if its blocking our new file
				if (sourcePath === finalPath) {
					fs.unlinkSync(sourcePath);
					sourceWasDeleted = true;
				}

				// move converted file into place
				const moveCommand = spawn('mv', [
					convertPath, finalPath
				]);

				moveCommand.on('exit', (code) => {
					logger.debug(`Moving converted file ${finalPath} finished with code ${code}`);

					if (0 !== code) {
						return accept();
					}
					
					// delete the source now if it wasn't deleted before
					if (!sourceWasDeleted) {
						fs.unlinkSync(sourcePath);
					}

					return db.fileConvertedToPlayable(fileId, finalPath).then(() => {
						logger.debug(`Converted and moved ${finalPath} success`);

						return accept(finalPath);
					});
				});
			});
		});
	},

	run: function() {
		db.getNotPlayableFiles().then((files) => {
			return Promise.each(files, this.convert);
		}).catch((error) => {
			logger.error(error);
		}).finally(() => {
			logger.debug('Finished converting unplayable shows. Restarting show converter in 10 seconds');

			setTimeout(() => {
				this.run();
			}, 10000);
		});
	},
};
