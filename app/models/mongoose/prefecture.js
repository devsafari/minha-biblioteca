var PrefectureModel = (function() {
  'use strict';

  var mongoose = require('mongoose'),
      Schema   = mongoose.Schema

  var CONSTANTS = {
  }

  var prefectureSchema = new Schema(
  { 
    site: String,
    address: {
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
        name: {type: String, default: ""},
      },
      district: {
        name: {type: String, default: ""}
      },
      number: {type: String, default: "" },
      street: {type: String, default: "" },
      zipcode: {type: String, default: "" },
      full_address: {type: String, default: "" }
    },
    emails: {type: Array, default: [] },
    mayor: {
      name: {type: String, default: ''},
      political_party: {type: String, default: ''}
    },
    telephones: {type: Array, default: []},
    created_at: {type: Date , default: Date.now },
    updated_at: {type: Date , default: Date.now }
  })

  prefectureSchema.virtual('constants').get(function() {
    return CONSTANTS
  });

  prefectureSchema.method('geocode', function() {

    var self = this;
    
    var Geocoder = require('geocoder');
    var address  = [].join("")

    Geocoder.geocode(address, function ( err, geocode_data ) {
      if(!(geocode_data.status == 'ZERO_RESULTS' || err)) {

        // if google returns address data, we normalize our data to make sure that is 100%(or almost 100%) right :)
        var first_result  = geocode_data.results[0], 
          position    = first_result.geometry.location,
          gmaps_address   = first_result.address_components;

         // address data to new library
         var location_data = {
          city: {
            name: (gmaps_address[0] ? gmaps_address[0].long_name : '')
          },
          country: {
            name: (gmaps_address[3] ? gmaps_address[3].long_name : ''),
           },
           coordinates: position,
           full_address: first_result.formatted_address,
        }

        callback.call(self)
      } else {
        callback.call(self)
      }
    })
  })

  return mongoose.model('Prefecture', prefectureSchema)

})()

module.exports = PrefectureModel;

