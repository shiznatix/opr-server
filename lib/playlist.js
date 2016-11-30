var path = require('path'),
	playlist = [],
	currentPosition = 0;

function setPlaylist(files) {
	if (!Array.isArray(files)) {
		throw new Error('Playlist files must be an array');
	}

	for (i = 0; i < files.length; i++) {
		if (!path.existsSync(files.length)) {
			throw new Error('Playlist path does not exist');
		}
	}

	// Set out master playlist array
	playlist = files;

	return true;
}

function getPlaylist() {
	return playlist;
}

function positionInPlaylistRange(position) {
	if (position > playlist.length || position < 0) {
		throw new Error('Position out of range');
	}

	return true;
}

function playAt(position) {
	positionInPlaylistRange(position);
	currentPosition = position;

	killRunningPlayer();
	playFile(playlist[currentPosition]);
}

function previous() {
	playAt((currentPosition - 1));
}

function next() {
	playAt((currentPosition + 1));
}

function keyCommand(command) {
	console.log('Key command: ' + command);
	return true;
}

function killRunningPlayer() {
	console.log('killRunningPlayer');
	return true;
}

function playFile(filePath) {
	console.log('Play file: ' + filePath);
	return true;
}

function random(params) {
	console.log(params);
	return true;
}

module.exports = {
	setPlaylist: function(files) {
		return setPlaylist(files);
	},

	getPlaylist: function() {
		return getPlaylist();
	},

	playAt: function(position) {
		return playAt(position);
	},

	previous: function() {
		return previous();
	},

	next: function() {
		return next();
	},

	keyCommand: function(command) {
		return keyCommand(command);
	},

	random: function(params) {
		return random(params);
	},
};