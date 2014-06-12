var Middlewares = (function() {
  'use strict'

  var extend = require('extend')

  var generateFlashMessage = function(flash) {
    var message = ''
    if(flash) {
      Object.keys(flash).forEach(function(key) {
        message += "<div class='alert alert-" + key + "'><button type='button' class='close' data-dismiss='alert'>×</button><span>&nbsp;&nbsp;" + flash[key] + "</span></div>";
      })
    }
    return message;
  }
  return {
    setup: function(app) {
      
      // Auth
      // only logged users can access admin
      app.use('/admin', function(req,res,next) {
        // login and logout are accessible to all users
        if(!req.session.user_id && !(req.path.match(/\/(login|logout)$\/?/ig))) {
          return res.redirect(req.xhr ? 401 : 302,'/admin/login');
        } else {
          var path = req.path.split("/")[1]
          if (path == '') path = 'dashboard'
          res.locals = extend(res.locals , {current_path: path, user_id: req.session.user_id, user_name: req.session.user_name})
        }
        res.locals.host = [req.protocol , "://" , req.headers.host].join('')
        res.locals.devEnv = ('development' === app.get('env'))
        res.locals.prodEnv = !res.locals.devEnv
        next();
      })
      
      // CSFR Token generation
      app.use(function(req, res, next){
        if(req.xhr) {
          console.log('Skipping CRSF Token generation cuz request is XHR'.inverse);
        } else {
          res.locals.csrf_token = req.csrfToken();
        }
        next();
      })

      // flash messages
      app.use(function (req, res, next) {
          var flash = req.session.flash;
          // clearing session messages
          req.session.flash = undefined;
          res.locals.session_message = generateFlashMessage(flash);
          next();
      });
    }
  }
})()

module.exports = Middlewares;
