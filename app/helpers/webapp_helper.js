module.exports = (function() {
  'use strict';

  var Library    = require(global.app.modelsPath + '/library')
  ,   Section    = require(global.app.modelsPath + '/section')

  var countField = function(key,callback) {
    Library.find().distinct(key, function(err, libraries) { 
      callback.call(null, err, libraries.length)
    })
  }

  var getSection = function(section_key, callback) {
    Section.findOrCreate({key: section_key}, function(err, section, created) {
      callback.call(null, section)
    })
  }

  var getValuesByKeyInitial = function(section, keys_initial, return_id) {
    var keys = Object.keys(section)
    ,   regexp = new RegExp("^" + keys_initial, 'i')
    ,   _keys  = [];

    keys.forEach(function(key, index) {
      var found = key.match(regexp);
      if(found) {
         _keys.push(return_id == true ? (key.replace(found.shift(), '')) : section[key] );
      }
    })
    return _keys;
  }

  var getIdsByKeyInitial = function(section, keys_initial) {
    return getValuesByKeyInitial(section,keys_initial, true)
  }

  var replaceSymbol = function(line) {
    var replace = function(text) {
      return text.replace(/^(\*)/ig, '<span class="circle"></span>')
    }
    return line.split(/\r\n/ig).map(replace);
  }

  var getSectionsJSON = function(callback) {
    Section.find({}, 'fields key', function(err, sections) {
      var _sections = {}
      sections.forEach(function(section,index) {
        var _fields = {};
        section.fields.forEach(function(field, findex) {
          _fields[field.key] = field.value 
        });
        _sections[section.key] =  _fields;
      })
      callback.call(null, { sections: _sections });
    })
  } 

  // ok, callback hell :/
  var getCounts = function(callback) {
    countField('address.city.name', function(err, total_cities) {
      countField('address.state.name', function(err, total_states) {
        countField('email', function(err, total_people) {
          countField('institution_name', function(err, total_institutions) {
            return callback.call(null , {
              total_people: total_people , 
              total_cities: total_cities, 
              total_states: total_states, 
              total_institutions: total_institutions
            });
          })
        })
      })
    })
  }

  var banners_analytics = [null,"?utm_source=site&utm_medium=banner&utm_campaign=250x250_verde","&utm_medium=banner&utm_campaign=250x250_azul","?utm_source=site&utm_medium=banner&utm_campaign=728x90","?utm_source=site&utm_medium=banner&utm_campaign=selo_1","?utm_source=site&utm_medium=banner&utm_campaign=selo_2"]

  return {
    getHomeCounters: getCounts,
    getSection: getSection,
    getSectionsJSON: getSectionsJSON,
    getValuesByKeyInitial: getValuesByKeyInitial,
    replaceSymbol: replaceSymbol,
    getIdsByKeyInitial: getIdsByKeyInitial,
    banners_tracking_codes: banners_analytics
  }
})();