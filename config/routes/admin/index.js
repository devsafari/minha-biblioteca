module.exports = (function() {
	'use strict';
	
	return {
		
		index: function(req,res) {
			require('./dashboard').index(req, res)
		},

		sessions: require('./sessions'),

		libraries: require('./libraries'),

		users: require('./users'),

		contacts: require('./contacts')
	}
})();