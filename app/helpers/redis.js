var path        = require('path')
,   redis_auth  = require(path.join(global.app.rootDir, 'config', 'dbconfig')).getDBURL('redis')
,   redis       = require('redis')
,   redisClient;

var redisStore = (function() {
  "use strict";

  
  var connectRedis = function() {
    if(!redisClient || redisClient.connected == false) {
      redisClient = redis.createClient(redis_auth.port, redis_auth.host);
      if(redis_auth.pass) {
        redisClient.auth(redis_auth.pass, function(err){
          if (err) throw err;
        });
      }
    }
  }

  var connect = function(callback) {

    connectRedis();

    redisClient.on('error', function(err) {
      if(callback != undefined) {
        callback.call(this, {error: err})
      }
    })

    redisClient.on('end', function() {
      console.log('Closing redis connection');
    })

    if(redis_auth.db) {
      redisClient.select(redis_auth.db);
    }

    redisClient.on('connect', function() {

      if(redis_auth.db) {
        redisClient.send_anyways = true;
        redisClient.select(redis_auth.db);
        redisClient.send_anyways = false;
      }
    })

    if(callback != undefined) {
      callback.call(this)
    }
  }

  return {
    client: function(callback) {
      return connect(function() {
        return callback.call(null,redisClient);
      })
    },
    flushDB: function(callback) {
      return connect(function() {
        var success = redisClient.flushdb(); 
        return callback.call(null, !!success);
      })
    },
    getOrSet: function(key, not_set_callback, expire, callback) {
      return connect(function() {
        redisClient.get(key, function(err, reply) {
          if(!reply) {
            return not_set_callback.call(null, function(value) {
              console.log('setting to cache, KEY=%s, TTL=%s', key, expire);
              reply = JSON.stringify(value);
              redisClient.setex(key, expire, reply)
              return callback.call(null, value)
            })
          } else {
            console.log('getting from cache, KEY=%s', key);
            return callback.call(null, JSON.parse(reply))
          }
        })
      })
    }
  }
})()



module.exports = redisStore;
