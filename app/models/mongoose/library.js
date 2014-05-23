var LibraryModel = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		  Schema   = mongoose.Schema,
		  extend 	 = require('extend');

	var CONSTANTS = {
		CATEGORIES: {
			"1": "Cidadãos",
			"2": "Poder Público"
		},
		SEX: {
			"1": "masculino",
			"2": "feminino"
		}
	}

	var path 	= require('path');

	var librarySchema = new Schema(
	{	
		address: {
			user_address: String,
			state: {
			  name: String,
			  uf: String,
			  region: String
			},
			city: {
			  name: String
			},
			coordinates: {
				lat: String, 
				lng: String
			},
			country: {
				name: String,
			},
			district: {
				name: String
			},
			full_address: String
		},
		category: {
			id: Number,
			name: String
		},
		type: Number,
		name: String,
		email: String,
		occupation: String,
		institution_name: String,
		sex: String,
		extra: {
			type_label: String,
			political_party_name: String,
			political_state: Number
			
		},
		count: {type: Number, default: 0},
		created_at: {type: Date , default: Date.now },
		updated_at: {type: Date , default: Date.now }
	})

	// Check if library yet exists in database
	librarySchema.method('yetExists', function(callback) {
		var library = this,
			db 		= mongoose.model('Library');

		var query = { 
			$and: [{
				'institution_name': 	 	library.institution_name	, 
				'address.state.uf': 	 	library.address.state.uf 	, 
				'address.city.name': 	 	library.address.city.name 	,
				// gmaps stuff
				'address.district.name': library.address.district.name 
			}]
		}

		db.where(query).findOne(function(err, doc) {
			callback.call(library, doc, !!doc)
		})
	})


	// return full address
	librarySchema.virtual('address.formatted_address').get(function() {
		return (this.address.full_address || this.address.user_address)
	})

	// return constants
	librarySchema.virtual('constants').get(function() {
		return CONSTANTS
	});

	librarySchema.method('beforeUpdate', function(data, callback) {

		var self = this 
		,	newData = {
			category: {
				id: data.category,
				name: CONSTANTS.CATEGORIES[data.category]
			},
			sex: CONSTANTS.SEX[data.sex]
		}

		self.updated_at = Date.now()
		
		self = extend(self, data, newData);

		return callback.call(this)

	})


	librarySchema.method('postCreate', function(data, callback, options) {

		var self		    = this,
			states 	 	    = require(path.join(global.app.rootAppDir, 'helpers', 'states')),
			state    	    = data.state.toUpperCase(),
			state_name 	  = states['states'][state],
			state_regions = states['regions'];


		var state_region;

		options = options || {};

		state_regions.forEach(function(item,index) {
		 	if(item.states.indexOf(state) != -1) {
		 		return state_region = item.region_name;
		 	}
		})

		// data normalization
		var newData = {
			category: {
				id: data.category,
				name: CONSTANTS.CATEGORIES[data.category]
			},
			sex: CONSTANTS.SEX[data.sex],
			extra: {
				political_party_name: data.political_party_name,
				political_state: data.political_state					
			}
		},
		// normalize address data
		address_data = {
			user_address: data.address,
			state: {
			  name: state_name,
			  uf: state,
			  region: state_region
			},
			city: {
			  name: data.city
			},
			coordinates: {
				lat: null, 
				lgn: null
			},
		}

		newData.address = extend(data.address, address_data)

		if(options.geocode == false) {
			self = extend(self, newData)
			return callback.call(self)
		}

		var Geocoder = require('geocoder');

		var address  = [newData.address.user_address, " - ", newData.address.city.name , ", " , newData.address.state.name, " - Brasil"].join('')

		Geocoder.geocode(address, function ( err, geocode_data ) {
			if(!(geocode_data.status == 'ZERO_RESULTS' || err)) {

				// if google returns address data, we normalize our data to make sure that is 100%(or almost 100%) right :)
				var first_result 	= geocode_data.results[0], 
					position 		= first_result.geometry.location,
					gmaps_address 	= first_result.address_components;

				 // address data to new library
				 var location_data = {
				 	city: {
				 		name: (gmaps_address[0] ? gmaps_address[0].long_name : newData.address.city.name)
				 	},
				 	country: {
					 	name: (gmaps_address[3] ? gmaps_address[3].long_name : ''),
					 },
					 coordinates: position,
					 full_address: first_result.formatted_address,
				}

				// endereço formatado para exibição
				location_data.formatted_address = [location_data.city.name, newData.address.state.name].join('');

				newData.address = extend(newData.address, location_data);

				self = extend(self, newData)
				callback.call(self)
			} else {
				self = extend(self, newData)
				callback.call(self)
			}
		})
	})

	return mongoose.model('Library', librarySchema)

})()

module.exports = LibraryModel;

