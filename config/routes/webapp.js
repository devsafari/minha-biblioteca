module.exports = (function() {
	'use strict';

	var libraries = require(__dirname + '/api/libraries')
	, contact = require(__dirname + '/api/contacts')
	, extend = require('extend')
	, Library = require(global.app.modelsPath + '/library')
	, prefix = "_site_"
	, redisStore = require(global.app.rootAppDir + '/helpers/redis')

	return {
		index: function(req,res) {

			var key = [prefix, "home_counters"].join('');

			res.locals.host = [req.protocol , "://" , req.headers.host].join('')

			// ok, callback hell :/
			var getCounts = function(callback) {
				Library.find().distinct('address.city.name', function(err, ids) {
					var total_cities = ids.length
					Library.find().distinct('address.state.name', function(err, ids) { 
						var total_states = ids.length
						Library.find().distinct('email', function(err, ids) {
							var total_people = ids.length;
							Library.find().distinct('institution_name', function(err, ids) {
								var total_institutions = ids.length;
								return callback.call(null , {total_people: total_people , total_cities: total_cities, total_states: total_states, total_institutions: total_institutions});
							})

						})
					})
				})
			}

			// cache the response in redis for 30 minutes
			redisStore.getOrSet(key, getCounts, 1800 /* 30 minutos */, function(data) {
				res.locals = extend(res.locals , data);
				return res.render('webapp/index');
			})

			
		},
		contact: contact,
		library: {
			create: function(req,res) {
				return libraries.create.call(libraries,req,res);
			}
		}
	}
})();