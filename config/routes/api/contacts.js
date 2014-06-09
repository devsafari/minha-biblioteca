module.exports = (function() {
  'use strict';

  var extend  = require('extend')
  , Contact   = require(global.app.modelsPath + '/contact')

  return {
    read: function(req,res,next) {
      var response = {success: false , contact: null , message: 'Invalid Contact'},
        callbackExists  = typeof next == 'object';

      // callback is used from anothers scripts, this way we don't need to call API route, just this method passing a callback
      if(callbackExists) var callback = next.callback;
      
      Contact.findOne({_id: req.params.id }, function(err, doc) {
        if(err || doc === null) {
          if(callbackExists) {
            return callback.call(null, response)
          }
          res.send(200, response);
        } else {
          extend(response, {success: true, contact: doc , message: 'Contact successfully fetch'});
          
          if(callbackExists) {
            next = next.next;
            return callback.call(null, response)
          } else {
            doc.email = undefined;
            res.send(200, response);
          }
        }
      })
    },
    all: function(req, res,next) {
      var response        = {success: false , contacts: [] , message: 'No records found'},
          callbackExists  = typeof next == 'object';

      if(callbackExists) var callback = next.callback;

      var limit  = req.param('limit') || null ,
          offset = req.param('offset') || null ;

      var getContacts = function(cb) {
        var conditions = req.param('conditions') ? req.param('conditions') : {}
        var query = Contact.find(conditions, {}).limit(limit).skip(offset).sort({created_at: -1});

        query.exec(function(err, docs) {
          if(err) {
            if (err) throw err;
          }
          return cb.call(null,err,docs);
        });
      }

      return getContacts(function(err,docs) {
        if(docs.length === 0) {
          if(callbackExists) {
            return callback.call(null, response)
          }
          return res.send(200, response)
        } else {
          extend(response , {success: true,  contacts: docs , total_records: docs.length , message: 'Contacts successfully fetched'})
          if(callbackExists) {
            next = next.next;
            return callback.call(null, response)
          } else {
            return res.send(200, response);
          }
        }
      })
    },
    create: function(req, res) {
      var Validation = require(__dirname + '/../../validators/contact'),
          data       = req.body.contact || {},
          response   = Validation(data);
      
      if(!response.has_errors) {

        data.ip     = req.ip;
        data.origin = req.headers.origin || req.headers.referrer || req.url;

        var newContact  = new Contact(data);

        newContact.postCreate(data, function() {
          newContact.save(function(err) {
            if (!err) {
              var mailer = require(global.app.rootAppDir + '/mailers/contact')(newContact);
              mailer.send(function(_data) {
                if(_data.error) {
                  res.send({error: 1 , message: 'Erro no envio do email.'});
                } else {
                  res.send({success: 1, data: newContact, message: 'Mensagem enviada com sucesso.'});
                }
              });
            } else {
              res.send({error: 1 , message: 'Erro no envio do email.'});
            }
          })
        })
      } else {
        res.send({error:1 , errors: response.errors})
      }
    }
  }
})();