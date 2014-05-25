$(function () {
	$('.subnavbar').find ('li').each (function (i) {
		var mod = i % 3;
		if (mod === 2) {
			$(this).addClass ('subnavbar-open-right');
		}
	});

	$(".filter select#library_category").on('change', function(ev) {
		var that = $(this),
			  url = $(":selected", that).data('url')
		document.location = url;
	})
	
	$("[data-method='delete']").click(function(ev) {
		ev.preventDefault();

		var self = $(this);

		var parent = self.parents(self.data('parent')).first()
		,	url    = self.attr('href');

		var defaultMessage = 'Você realmente deseja deletar este item?';

		if(confirm(self.data('message') || defaultMessage)) {
			$.ajax({url: url, data: {_csrf: CSRF_TOKEN} , type: "DELETE" , dataType: 'json'}).done(function(data) {
				if(data.message) alert(data.message);
				if(data.success) {
					if(self.data('redirect')) {
						document.location.href = self.data('redirect');
					} else if(parent.size() > 0) {
						$(parent).fadeOut(function() {
							$(this).remove();
						})
					}
				}
			})
		}

	})
});