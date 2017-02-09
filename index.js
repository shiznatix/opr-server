const currentDir = __dirname,
	config = require(`${currentDir}/config/config.json`),
	logger = require(`${currentDir}/lib/logger.js`),
	shows = require(`${currentDir}/lib/shows.js`),
	db = require(`${currentDir}/lib/db.js`),
	validator = require(`${currentDir}/lib/validator.js`),
	express = require('express'),
	bodyParser = require('body-parser'),
	_ = require('lodash'),
	app = express();

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
	app.listen(config.port, () => {
		logger.info('Started server (plain text) on port ' + config.port);
	});

	// Start scanning directories
	shows.startScan();
});