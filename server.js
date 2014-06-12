// This file is called 'server.js' because is the openshift convention for node.js apps(they don't follow Procfile rules)
(function() {
  "use strict";
  //require('newrelic');

  var express    = require('express'),
      mongoose   = require('mongoose'),
      path       = require('path');
  
  global.app     = express();
  express.application = app;   /* hack for express-namespace */
  require('express-namespace');

  app.rootDir    = __dirname
  app.rootAppDir = path.join(__dirname , 'app/');
  app.modelsPath = path.join(app.rootAppDir , 'models' , 'mongoose')

  var routes     = require(path.join(__dirname, 'config', 'routes'));
  var config     = require(path.join(__dirname, 'config'))

  config.setup(app, express);
  config.setupDatabase(mongoose);
  routes.setup(app);

  var port = process.env.PORT || 3000;
  app.listen(port);

  console.log('Express server listening on port = %s'.cyan, port);
  module.exports = exports = app;
})();
