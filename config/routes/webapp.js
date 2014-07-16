module.exports = (function() {
  'use strict';

  var path      = require('path')
  var libraries = require(path.join(__dirname, 'api', 'libraries'))
  , contact     = require(path.join(__dirname, 'api', 'contacts'))
  , extend      = require('extend')
  , Library     = require(path.join(global.app.modelsPath,'library'))
  , prefix      = "_site_"
  , redisStore  = require(path.join(global.app.rootAppDir, 'helpers', 'redis'))
  , helper      = require(path.join(global.app.rootAppDir, 'helpers', 'webapp_helper'));

  return {
    index: function(req,res) {
      var counter_key  = [prefix, "home_counters"].join(''),
          sections_key = [prefix, 'sections'].join('');

       res.locals.host = [req.protocol , "://" , req.headers.host].join('');

       // cache the response in redis for 30 minutes
       redisStore.getOrSet(counter_key, helper.getHomeCounters, 1800 /* 30 minutos */, function(data) {
        redisStore.getOrSet(sections_key, helper.getSectionsJSON, 1800, function(sections) {
          res.locals = extend(res.locals , data, sections);
           
          // helper methods
          res.locals.getValuesByKeyInitial = helper.getValuesByKeyInitial;
          res.locals.getIdsByKeyInitial    = helper.getIdsByKeyInitial;
          res.locals.replaceSymbol         = helper.replaceSymbol;
          res.locals.printGA               = helper.printGA;
          res.locals.getYoutubeVideoID     = helper.getYoutubeVideoID;
          res.locals.putsHTML              = function(text) { return text ; }
          res.locals.toDowncase            = function(text) { return text.toLowerCase(); }
           
          return res.render('webapp/index');

        })
       });
        
    },
    contact: contact,
    library: {
      create: function(req,res) {
        return libraries.create.call(libraries,req,res);
      }
    }
  }
})();
