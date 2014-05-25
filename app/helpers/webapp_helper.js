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

  var getKeysByInitials = function(section, keys_initial) {
    var keys = Object.keys(section)
    ,   regexp = new RegExp("^" + keys_initial, 'i')
    ,   _keys  = [];

    keys.forEach(function(key, index) {
      if(key.match(regexp)) {
        _keys.push(section[key])
      }
    })

    return _keys;
  }
  var replaceSymbol = function(line) {
    var replace = function(text) {
      return text.replace(/^(\*)/ig, '<span class="circle"></span>')
    }
    return line.split(/\r\n/ig).map(replace);
  }

  var range = function(init,end) {
    var _range = [];
    for(var i = init; i <= (end + 1); i++) _range.push(i);
    return _range;
  }

  var getSectionsJSON = function(callback) {
    Section.find({}, 'fields key', function(err, sections) {
      var _sections = {}
      sections.forEach(function(section,index) {
        var _fields = {};
        section.fields.forEach(function(field, findex) {
          _fields[field.key] = field.value 
        });
        _fields.total_keys = Object.keys(_fields).length;
        _fields.keys_range = range(1,_fields.total_keys);
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

  return {
    getHomeCounters: getCounts,
    getSection: getSection,
    getSectionsJSON: getSectionsJSON,
    getKeysByInitials: getKeysByInitials,
    replaceSymbol: replaceSymbol
  }
})();