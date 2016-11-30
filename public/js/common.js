const ALERTS = {
	'SUCCESS': 1,
	'INFO': 2,
	'WARN': 3,
	'ERROR': 4,
};

function guidGenerator() {
	const S4 = function() {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	};

	return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
}

function requestWasSuccessfull(error, data, requireDataArray = false) {
	if (error) {
		return false;
	}

	if (requireDataArray && (!Array.isArray(data) || data.length < 1)) {
		return false;
	}

	return true;
}

function sendCommand(command, callback) {
	$.get('/' + command.url, function(data) {
		if (!data.success) {
			callback(new Error('Request failed'), data);
			return;
		}

		callback(null, data.data);
	})
	.fail(function(error) {
		callback(error);
	});
}

function postCommand(command, params, callback) {
	$.post('/' + command.url, params, function(data) {
		if (!data.success) {
			callback(new Error('Request failed'), data);
			return;
		}

		callback(null, data.data);
	})
	.fail(function(error) {
		callback(error);
	});
}

function toast(text, level) {
	let toastClass;

	if (level === ALERTS.ERROR) {
		toastClass = 'danger';
	} else if (level === ALERTS.WARN) {
		toastClass = 'warning';
	} else if (level === ALERTS.SUCCESS) {
		toastClass = 'success';
	} else {
		toastClass = 'info';
	}

	const toastId = guidGenerator(),
		html = `
			<div id="` + toastId + `" class="alert alert-` + toastClass + ` alert-dismissible">
				<a href="#" class="close" data-dismiss="alert" aria-label="close">×</a>
				` + text + `
			</div>
		`;

	$('#toast-container').html(html);

	// auto-remove after 5 seconds
	setTimeout(function() {
		$('#' + toastId).fadeOut();
	}, 2000);
}