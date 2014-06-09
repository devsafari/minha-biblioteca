var AdminUser = require(global.app.modelsPath + '/admin_user');

module.exports = {

	new: function(req,res,next) {
		res.render('admin/sessions/new', {layout:'admin/layout'})
	},

	login: function(req,res, next) {

		var user_data = req.body.user;

		AdminUser.auth(user_data.email, user_data.password, function(isAuthorized, user) {
			if(isAuthorized) {
				req.session.user_id   = user._id;
				req.session.user_name = user.name;
				req.flash('success', 'User successfully logged')
				return res.redirect('/admin/')
			} else {
				req.flash('error' , 'Invalid credentials')
				return res.redirect('/admin/login/')
			}
		})
	},
	logout: function(req,res) {
		req.session.user_id = undefined;
		req.flash('success', 'Successfully logged out')
		res.redirect('/admin/login');
	}
}