var LibraryModel = (function() {
  'use strict';

  var mongoose = require('mongoose'),
      Schema   = mongoose.Schema,
      extend   = require('extend');

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

  var path  = require('path');

  var librarySchema = new Schema(
  { 
    address: {
      user_address: String,
      number: String,
      street: String,
      zipcode: String,
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
    _school: { type: Schema.Types.ObjectId, ref: 'School'},
    count: {type: Number, default: 0},
    created_at: {type: Date , default: Date.now },
    updated_at: {type: Date , default: Date.now },
    users: { type: Array, default: [] }
  })

  // Check if library yet exists in database
  librarySchema.method('yetExists', function(callback) {
    var library = this,
        db      = mongoose.model('Library');

    var query = { 
      $and: [{
        'institution_name':     library.institution_name  , 
        'address.state.uf':     library.address.state.uf  , 
        'address.city.name':    library.address.city.name   ,
        // gmaps stuff
        'address.district.name': library.address.district.name
      }],
    }

    if(!!library._school) {
      var first_query = { '_school': library._school }
      db.where(first_query).findOne(function(err, doc) {
        if(!!doc) {
          return callback.call(library, doc, !!doc) 
        } else {
          db.where(query).findOne(function(err, doc) {
            return callback.call(library, doc, !!doc)
          })
        }
      })
    } else {
      db.where(query).findOne(function(err, doc) {
        return callback.call(library, doc, !!doc)
      })
    }
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
    , newData = {
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

    var self        = this,
      states        = require(path.join(global.app.rootAppDir, 'helpers', 'states')),
      state         = data.state.toUpperCase(),
      state_name    = states['states'][state],
      state_regions = states['regions'];


    var normalizeAddress = function(callback) {
      // dont use this anymore
      if(false && self._school) {
        var School = require(path.join(global.app.modelsPath, 'school'))

        School.findOne(self._school, function(err, doc) {
          var address_data =  doc.address
          address_data.user_address = address_data.full_address
          return callback.call(null, address_data);
        })
      } else {
        
        var state_region;
        state_regions.forEach(function(item,index) {
          if(item.states.indexOf(state) != -1) {
            return state_region = item.region_name;
          }
        })

        // normalize address data
        var address_data = {
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
          }
        }
        return callback.call(null, address_data);
      }
    }

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
    }
    
    options = options || {};

    normalizeAddress(function(address_data) {
      newData.address = extend(data.address, address_data)
      var add = newData.address
      
      var need_to_geocode = !(!!add.user_address  && !!add.city.name && !!add.state.name)

      if(options.geocode == false) {
        self = extend(self, newData)
        return callback.call(self)
      }

      var Geocoder = require('geocoder');
      var address  = [newData.address.user_address, " - ", newData.address.city.name , ", " , newData.address.state.name, " - Brasil"].join('')

      Geocoder.geocode(address, function ( err, geocode_data ) {
        if(!(geocode_data.status == 'ZERO_RESULTS' || err)) {

          // if google returns address data, we normalize our data to make sure that is 100%(or almost 100%) right :)
          var first_result  = geocode_data.results[0], 
            position    = first_result.geometry.location,
            gmaps_address   = first_result.address_components;

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
  })

  return mongoose.model('Library', librarySchema)

})()

module.exports = LibraryModel;

