const currentDir = __dirname,
	config = require(currentDir + '/config/config.json'),
	routes = require(currentDir + '/config/routes.json'),
	logger = require(currentDir + '/lib/logger.js'),
	playlist = require(currentDir + '/lib/playlist.js'),
	COMMANDS = require(currentDir + '/lib/commands.js'),
	express = require('express'),
	bodyParser = require('body-parser'),
	_ = require('lodash'),
	app = express();

function basicSuccess(request, response) {
	jsonResponse(response);
}

function basicFailure(request, response, error) {
	jsonResponse(response, {'error': error.message}, false, 500);
}

function jsonResponse(response, data = null, success = true, status = 200) {
	response.status(status).json({
		'success': success,
		'data': data,
	});
}

function playlistCall(request, response, method, params = null) {
	try {
		jsonResponse(response, playlist[method](params));
	} catch (error) {
		basicFailure(request, response, error);
	}
}

function playlistCommand(request, response, command) {
	try {
		jsonResponse(response, playlist.keyCommand(command));
	} catch (error) {
		basicFailure(request, response, error);
	}
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	'extended': true,
}));

// Public files
app.use(express.static(__dirname + '/public'));

// API routes
app.get('/heartbeat', basicSuccess);
/*app.get('/restore-last-playlist', function(request, response) {
	jsonResponse(response, [
		'one',
		'two',
		'three',
		'four',
	]);
});*/

app.get('/close-player', function(request, response) {
	playlistCommand(request, response, COMMANDS.CLOSE);
});
app.get('/volume-down', function(request, response) {
	playlistCommand(request, response, COMMANDS.VOL_DOWN);
});
app.get('/volume-up', function(request, response) {
	playlistCommand(request, response, COMMANDS.VOL_UP);
});
app.get('/play-pause', function(request, response) {
	playlistCommand(request, response, COMMANDS.PLAY_PAUSE);
});
app.get('/forward', function(request, response) {
	playlistCommand(request, response, COMMANDS.FORWARD);
});
app.get('/back', function(request, response) {
	playlistCommand(request, response, COMMANDS.BACK);
});

app.get('/current-playlist', function(request, response) {
	playlistCall(request, response, 'getPlaylist');
});
app.get('/previous', function(request, response) {
	playlistCall(request, response, 'previous');
});
app.get('/next', function(request, response) {
	playlistCall(request, response, 'next');
});

app.post('/random', function(request, response) {
	playlistCall(request, response, 'random', {
		'shows': request.body.shows,
		'playlistSize': request.body.playlistSize,
		'enqueue': !!request.body.enqueue,
	});
});

app.get('*', function(request, response) {
	jsonResponse(response, false, null, 404);
});

// Start web server
app.listen(config.port, function() {
	logger.info('Started server (plain text) on port ' + config.port);
});