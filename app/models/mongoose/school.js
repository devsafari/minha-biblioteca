var PrefectureModel = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		  Schema   = mongoose.Schema

	var CONSTANTS = {
	}

	var schoolSchema = new Schema(
	{	
		email: {type: String, default: "" },
		kind: {type: String, default: "" },
		address: {
			complement: {type: String, default: ""},
			number: {type: String, default: "" },
			street: {type: String, default: "" },
			zipcode: {type: String, default: "" },
			city:  {
				name: {type: String, default: ""}
			},
			state: {
			  name: {type: String, default: ""},
			  uf: {type: String, default: ""},
			  region: {type: String, default: ""}
			},
			coordinates: {
				lat: {type: String, default: ""}, 
				lng: {type: String, default: ""}
			},
			country: {
				name: {type: String, default: "Brasil"},
			},
			district: {
				name: {type: String, default: ""}
			},
			full_address: {type: String, default: "" }
		},
		telephone: {type: Object, default: {
			ddd: "",
			tel: ""
		}},
		fax: {type: Object, default: {
			ddd: "",
			tel: ""
		}},
		education: {type: Array, default: []},
		others: {type: Array, default: []},
		created_at: {type: Date , default: Date.now },
		updated_at: {type: Date , default: Date.now }
	})

	schoolSchema.virtual('constants').get(function() {
		return CONSTANTS
	});

	return mongoose.model('School', schoolSchema)

})()

module.exports = PrefectureModel;

