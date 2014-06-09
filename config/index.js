var self   = {},
  path     = require('path'),
  database = require('./database')

self.setup = function(app, express) {
  
  var swig      = require('swig'),
    flash       = require('connect-flash'),
    middlewares = require('./middlewares'),
    devEnv      = ('development' == app.get('env'));

  swig.setDefaults({ cache: false });

  app.engine('html', swig.renderFile);

  app.set('port'  , process.env.PORT || 8080);
  app.set('views' , app.rootAppDir + '/views')
  app.set('view engine', 'html')
  app.set('layout', 'webapp/layout')
  app.set('view cache', true); // cache view for production (by default)
  //app.set('view cache', !devEnv); // 

  // https://api.wordpress.org/secret-key/1.1/salt/
  app.set('session_secret', '+(O:wvx2Wms;+;U%Y.v$]ag?o$lC1VE*-;m(|4`e>`KBKcusG&o=snNZ}pG>v.C)')

  app.use(express.favicon())
  app.use(express.logger('dev'))
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(express.cookieParser())

  require('./session_store')(express, app, true);

  app.use(express.csrf());
  app.use(flash());

  middlewares.setup(app);

  app.use(app.router)

  app.use(express.static(path.join(app.rootDir, 'public', 'html')))

  if (devEnv) {
    app.use(express.errorHandler())
    app.set('view cache', false); // dont cache view in development
  }
}

self.setupDatabase = database.setupDatabase
module.exports = self