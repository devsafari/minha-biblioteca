var self = {},
  path = require('path');

self.setupDatabase = function(mongoose, connection_callback) {
  var dbConfig = require('./dbconfig'),
    connectURL = dbConfig.getDBURL('mongodb')

  global.appDatabase = mongoose.connect(connectURL);

  var db = mongoose.connection;
  
  db.on('error', console.error.bind(console, ('connection error: url = ' + connectURL).red));

  db.on('open', function callback () {
    console.log('===================================================================='.yellow)
    console.log(('MongoDB Connection with url = ' + connectURL + " successfully opened").yellow)
    console.log('===================================================================='.yellow)

    if(connection_callback) connection_callback.call(null)
  })
}

self.getDatabase = function(dbName) {
  return global.appDatabase;
}

module.exports = self;
