var parseRedisURL = function(url) {

	 if (!url) return ''

	 var rtg   		= require("url").parse(url),
	 	redisAuth 	= rtg.auth.split(':')

	 return {
		host: rtg.hostname,
		port: rtg.port,
		db: redisAuth[0],
		pass: redisAuth[1],
		prefix: '_session'
	 }
}

var dbConfig =  {
	mongodb: {
		test: {
			url: "mongodb://localhost/euquerominhabiblioteca_test"
		},
		development: {
			//url: "mongodb://localhost/euquerominhabiblioteca_development", //"mongodb://admin:@localhost/EcoDB"
			url: "mongodb://heroku:r3ldnJP10iZ_t2o4__1wtRLxPrLuab6tFusPrRggd8i605FuMqrzNMJppOpRJQeSYvx9uogalQmbw2meX1P_pw@oceanic.mongohq.com:10078/app25614466"
		},
		production: {
			url: process.env.MONGOHQ_URL
		}
	},
	redis: {
		test: {
			url: {
				host: 'localhost',
    			port: 6379,
    			db: 2,
    			prefix: '_session',
    			pass: 'test'
    		}
     	},
		development: {
      		url: parseRedisURL('redis://admin:5V8Gnx3D@localhost:6379')
		},
		production: {
			url: parseRedisURL(process.env.REDISTOGO_URL || process.env.REDIS_URL)
     	}
    },
    
    getDB: function(key) {
    	return this[key][process.env.NODE_ENV || "development"]
    },
    getDBURL: function(key) {
    	return this.getDB(key)['url']
    }
}

module.exports = dbConfig
