const currentDir = __dirname,
	config = require(`${currentDir}/config/config.json`),
	logger = require(`${currentDir}/lib/logger.js`),
	Shows = require(`${currentDir}/lib/shows.js`),
	Browse = require(`${currentDir}/lib/browse.js`),
	db = require(`${currentDir}/lib/db.js`),
	express = require('express'),
	bodyParser = require('body-parser'),
	_ = require('lodash'),
	app = express();

function errorResponse(response, error, data = null) {
	response.status(400).json({
		'success': false,
		'data': data,
		'error': error,
	});
}
function successResponse(response, data = null) {
	response.status(200).json({
		'success': true,
		'data': data,
	});
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	'extended': true,
}));

// API routes
app.post('/random', function(request, response) {
	shows.random(request.body.showNames, request.body.amount)
		.then(function(data) {
			jsonResponse(response, data);
		})
		.catch(function(error) {
			basicFailure(response, error);
		});
});
app.post('/browse', function(request, response) {
	const browse = new Browse;

	browse.getFiles(request.body.path)
		.then(function(data) {
			jsonResponse(response, data);
		})
		.catch(function(error) {
			basicFailure(response, error);
		});
});
app.get('/shows', function(request, response) {
	shows.getByCategories()
		.then(function(data) {
			successResponse(response, data);
		})
		.catch(function(error) {
			errorResponse(response, error);
		});
});

app.get('*', function(request, response) {
	response.status(404).json({
		'success': false,
	});
});

// make sure our DB exists before we start up
db.initDb().then(() => {
	// Start web server
	app.listen(config.port, function() {
		logger.info('Started server (plain text) on port ' + config.port);
	});

	// Start scanning directories
	const shows = new Shows;
	shows.startScan();
	shows.getByCategories();
});