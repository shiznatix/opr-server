const currentDir = __dirname,
	config = require(currentDir + '/config/config.json'),
	logger = require(currentDir + '/lib/logger.js'),
	shows = require(currentDir + '/lib/shows.js'),
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
	const params = {
		'shows': request.body.shows,
		'playlistSize': request.body.playlistSize,
		'enqueue': !!request.body.enqueue,
	};

	playlist.random(params)
		.then(function(data) {
			jsonResponse(response, data);
		})
		.catch(function(error) {
			basicFailure(response, error);
		});
});
app.post('/browse', function(request, response) {
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

// Start web server
app.listen(config.port, function() {
	logger.info('Started server (plain text) on port ' + config.port);
});