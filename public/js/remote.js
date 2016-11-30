$(document).ready(function() {
	$('#domain').text(document.domain);
});

$('.command').click(function(event) {
	event.preventDefault();

	const command = $(this).data('cmd');

	if (!COMMANDS[command]) {
		console.log('Command not found: ' + command);
		return;
	}

	sendCommand(COMMANDS[command], function(error, data) {
		if (error) {
			toast('Command failed! Check your connection and try again.', ALERTS.ERROR);
			return;
		}

		toast('Success! The server is responding normally.', ALERTS.SUCCESS);
	});
});

$('.command-random').click(function(event) {
	event.preventDefault();

	const params = {
		'type': $(this).data('type'),
		'size': $('input[name=playlistSize]:checked', '#random-form').val(),
	};

	if (!params.size) {
		return;
	}

	postCommand(COMMANDS.random, params, function(error, data) {
		if (!requestWasSuccessfull(error, data, true)) {
			toast('Could not play random.', ALERTS.ERROR);
			$('#modal-random').modal('toggle');
			return;
		}

		let files = [];

		for (const i = 0; i < data.length; i++) {
			files.append(data[i]);
		}

		toast('Playlist:\n' + files.join('\n'), ALERTS.SUCCESS);

		$('#modal-random').modal('toggle');
	});
});

$('#play-file').click(function(event) {
	event.preventDefault();

	$('#play-file-form').html('');

	sendCommand(COMMANDS.currentPlaylist, function(error, data) {
		if (!requestWasSuccessfull(error, data, true)) {
			toast('Could not load playlist or playlist was empty.', ALERTS.ERROR);
			return;
		}

		for (var i = 0; i < data.length; i++) {
			$('#play-file-form').html().append(`
				<div class="radio">
					<label><input type="radio" name="playlistSize" value="1">VIDEO FILE</label>
				</div>
			`);
		}

		$('#play-file').modal();
	});
});