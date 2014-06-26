module.exports = (function() {

  var extend   = require('extend')
  , path       = require('path')
  , prefix     = '_cache_'
  , redis      = require(path.join(global.app.rootAppDir, 'helpers', 'redis'))
  , fbURL      = "http://graph.facebook.com/InstitutoEcofuturo";

  var dashboard = {
    init:  function(callback) {
      var http     = require('http')
      , Library    = require(path.join(global.app.modelsPath, 'library'))
      , Contact    = require(path.join(global.app.modelsPath, 'contact'));

      var httpReq = http.get(fbURL , function( response ) { 
        response.on('data', function(d) {
          var fb_data = JSON.parse(d.toString()); 

          Library.count({}, function(err, library_count) {
            Contact.count({}, function(err, contact_count) {
              return callback.call(null, {fb_total_likes: fb_data.likes , total_libraries: library_count , total_contacts: contact_count })
            })
          })
        });
      }).on('error', function(e) {
        return callback.call(null , {error: 1 , error_obj: e })
      });
      httpReq.end();
    },
    index: function(cb) {
      var key = [prefix, fbURL.toLowerCase()].join('');

      redis.getOrSet(key, this.init, 3600, function(data) {
        cb.call(null, data);  
      })
    }
  }

  return {
    index: function(req, res) {
      dashboard.index(function(response) {
        res.locals = extend(res.locals, response)
        return res.render('admin/dashboard' ,  {layout: 'admin/layout' });
      })
    }
  }
})()
