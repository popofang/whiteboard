$(document).ready(function() {
	$('#colorValue').change(function(event) {
		$('.colors').css('color', '#' + this.value);
	});
});