module.exports = (function() {
  'use strict';

  var path    = require('path')
  var extend  = require('extend')
  , School    = require(path.join(global.app.modelsPath, 'school')),
    _s        = require('underscore.string');

  return {
    autocomplete: function(req,res,next) {
      var state_uf    = req.param('state'),
          city        = req.param('city'),
          name        = req.param('name');

      var response_error = function(res, message) {
        return res.json(403, {error: 1, message: message, status: 403})
      }

      if(!state_uf) {
        return response_error(res, 'invalid state')
      } else if (!city) {
        return response_error(res, 'invalid city')
      } else if(!name) {
        return response_error(res, 'Name must be present')
      } else if(name && name.length < 3) {
        return response_error(res, 'Name must have at least 3 characters')
      }

      function escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      }

      var query       = escapeRegExp(name).latinise(),
          queryRegexp = new RegExp(query, 'i');

      var conditions = {
        $and: [ 
          {'address.state.uf':      _s.clean(state_uf.toUpperCase()) }, 
          {'address.city.name':     _s.clean(_s.titleize(city))      }, 
          {'name':                  queryRegexp                      }, 
        ]
      }

      School.find(conditions, 'name address.city.name address.uf address.district address.number address.street kind', function(err, results) {

        res.json({success: 1, schools: results, count: results.length});
      })
    }
  }
})()
