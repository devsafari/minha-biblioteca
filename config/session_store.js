var sessionStore = function(express,app,use_redis) {

  if(use_redis) {
    var RedisStore = require('connect-redis')(express),
      redis_auth = require('./dbconfig').getDBURL('redis')

    console.log('--------------------------------------------------------------------'.yellow)
    console.log('Trying to connect with redis using = %s'.yellow, JSON.stringify(redis_auth));
    console.log('--------------------------------------------------------------------'.yellow)
    
    // setup redis as session store
    app.use(express.session({
      secret: app.get('session_secret'),
      maxAge : Date.now() + 7200000, // 2h Session lifetime
      store: new RedisStore(redis_auth)
    }))
    express.query()
  } else {
    // normal session store
    app.use(express.session({secret: app.get('session_secret') }))
  }
}

module.exports = sessionStore
