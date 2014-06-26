module.exports = (function() {
  'use strict';

  var path       = require('path')
  var Library    = require(path.join(global.app.modelsPath, 'library'))
  ,   User       = require(path.join(global.app.modelsPath, 'user'))
  ,   Section    = require(path.join(global.app.modelsPath, 'section'))

  var countField = function(model, key,callback) {
    var query  = {}
    query[key] = { "$exists": true }

    model.count(query, function(err, total) { 
      return callback.call(null, err, total)
    })
  }

  var countDistinctField = function(model, key, callback){
    model.find().distinct(key, function(err, libraries) { 
      return callback.call(null, err, libraries.length)
    })
  }

  var getSection = function(section_key, callback) {
    Section.findOrCreate({key: section_key}, function(err, section, created) {
      callback.call(null, section)
    })
  }

  var getValuesByKeyInitial = function(section, keys_initial, return_id) {
    var keys    = Object.keys(section || {})
    ,   regexp  = new RegExp("^" + keys_initial, 'i')
    ,   _keys   = [];

    keys.forEach(function(key, index) {
      var found = key.match(regexp);
      if(found) {
         _keys.push(return_id == true ? (key.replace(found.shift(), '')) : section[key] );
      }
    })
    return _keys;
  }

  var getYoutubeVideoID = function(video_url) {
    var regexp  = /watch\?v=([^&]+)/ig;
    var results = regexp.exec(video_url);
    return (results ? results.pop() : null);
  }

  var getIdsByKeyInitial = function(section, keys_initial) {
    return getValuesByKeyInitial(section,keys_initial, true).sort(function(a, b) { return a-b })
  }

  var print_ga_track_code = function(tracking_url) {
    return tracking_url.trim().replace(/^\?{0,}/ig, '?');
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
    countDistinctField(Library, 'address.city.name', function(err, total_cities) {
      countDistinctField(Library, 'address.state.name', function(err, total_states) {
        countField(User, 'email', function(err, total_people) {
          countField(Library, 'institution_name', function(err, total_institutions) {
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
    getValuesByKeyInitial: getValuesByKeyInitial,
    replaceSymbol: replaceSymbol,
    getIdsByKeyInitial: getIdsByKeyInitial,
    printGA: print_ga_track_code,
    getYoutubeVideoID: getYoutubeVideoID
  }
})();
