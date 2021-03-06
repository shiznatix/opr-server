const config = require(`${__dirname}/config/config.json`);
const logger = require(`${__dirname}/lib/logger.js`);
const shows = require(`${__dirname}/lib/shows.js`);
const showConverter = require(`${__dirname}/lib/show-converter.js`);
const db = require(`${__dirname}/lib/db.js`);
const validator = require(`${__dirname}/lib/validator.js`);
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

let appServer = null;

process.on('uncaughtException', function (error) {
	logger.error('Uncaught exception!');
	logger.error(error);
});

process.on('SIGTERM', () => {
	logger.info('SIGTERM received');

	// if we haven't exited within 2 seconds, just die
	const killTimeout = setTimeout(() => {
		logger.info('SIGTERM - app server not cleanly closed, exiting');

		process.exit(1);
	}, 2000);

	appServer.close(() => {
		clearTimeout(killTimeout);
		logger.info('SIGTERM - app server closed, exiting');

		process.exit(0);
	});
});

function errorResponse(response, error, data = null) {
	response.status(400).json({
		success: false,
		data: data,
		error: error,
	});
}
function successResponse(response, data = null) {
	response.status(200).json({
		success: true,
		data: data,
	});
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true,
}));

// API routes
app.post('/random', (request, response) => {
	validator.random(request.body).then((params) => {
		return shows.random(params.showNames, params.amount);
	}).then((data) => {
		successResponse(response, data);
	}).catch((error) => {
		logger.error(error);
		errorResponse(response, error);
	});
});
app.put('/set-last-played-time', (request, response) => {
	validator.setLastPlayedTime(request.body).then((params) => {
		return db.setLastPlayedTime(params.filePaths);
	}).then(() => {
		successResponse(response);
	}).catch((error) => {
		logger.error(error);
		errorResponse(response, error);
	});
});
app.put('/set-file-not-playable', (request, response) => {
	validator.setFileNotPlayable(request.body).then((params) => {
		return db.setFileNotPlayable(params.filePath);
	}).then(() => {
		successResponse(response);
	}).catch((error) => {
		logger.error(error);
		errorResponse(response, error);
	});
});
app.get('/shows', (request, response) => {
	shows.getByCategories().then((data) => {
		successResponse(response, data);
	}).catch((error) => {
		logger.error(error);
		errorResponse(response, error);
	});
});

app.get('*', (request, response) => {
	response.status(404).json({
		success: false,
	});
});

// make sure our DB exists before we start up
db.initDb().then(() => {
	// Start web server
	appServer = app.listen(config.port, () => {
		logger.info('Started server (plain text) on port ' + config.port);
	});

	// Start scanning directories
	shows.startScan();
	showConverter.run();
});