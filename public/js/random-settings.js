$(document).ready(function() {
	sendCommand(COMMANDS.showCategories, function(error, data) {
		if (!requestWasSuccessfull(error, data, true)) {
			console.log('NO DICE! MAYBE GO BACK?');
			return;
		}

		console.log('show cateogires are:');
		console.log(data);
	});
});