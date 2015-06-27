$(function () {
	var hist = window.history;
	$('#testBack').click(function () {
		debugger;
		var url = hist.back();
		alert(url);
	});
});
