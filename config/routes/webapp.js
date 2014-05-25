module.exports = (function() {
    'use strict';

    var libraries = require(__dirname + '/api/libraries')
    , contact = require(__dirname + '/api/contacts')
    , extend = require('extend')
    , Library = require(global.app.modelsPath + '/library')
    , prefix = "_site_"
    , redisStore = require(global.app.rootAppDir + '/helpers/redis')
    , helper     = require(global.app.rootAppDir + '/helpers/webapp_helper');

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
                 res.locals.getKeysByInitials     = helper.getKeysByInitials;
                 res.locals.replaceSymbol         = helper.replaceSymbol;
                 res.locals.sections.share.ga     = [null,"?utm_source=site&utm_medium=banner&utm_campaign=250x250_verde","&utm_medium=banner&utm_campaign=250x250_azul","?utm_source=site&utm_medium=banner&utm_campaign=728x90","?utm_source=site&utm_medium=banner&utm_campaign=selo_1","?utm_source=site&utm_medium=banner&utm_campaign=selo_2"]
                 res.locals.putsHTML              = function(text) { return text ; }
                 
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