module.exports = (function() {
  'use strict';

  var redis = require(global.app.rootAppDir + '/helpers/redis')
  
  return {
    
    index: function(req,res) {
      require('./dashboard').index(req, res)
    },

    delete_cache: function(req,res) {
      var response = {success: 1,  message: 'Cache foi atualizado com sucesso'};

      redis.flushDB(function(success) {
        if(!success) response.message = "Erro ao apagar o cache";
        response.success = success;
        req.session.destroy();
        res.send(200, response);
      })
    },

    sessions: require('./sessions'),

    libraries: require('./libraries'),

    users: require('./users'),

    contacts: require('./contacts'),

    manage: require('./manage')
  }
})();