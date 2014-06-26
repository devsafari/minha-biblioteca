var routes  = this
, libraries = {}
, extend    = require('extend')
, path      = require('path')
, Library   = require(path.join(global.app.modelsPath, 'library'))
, User      = require(path.join(global.app.modelsPath, 'user'))
, mongoose  = require('mongoose')
, helper    = require(path.join(global.app.rootAppDir, 'helpers', 'api_helper'))
, checkSpamDoBem = require(path.join(global.app.rootAppDir, 'helpers', 'spam_do_bem'));


var mailUser = function(email, data,callback) {
  var mailer      = require(path.join(global.app.rootAppDir , 'mailers', 'signup'))(data)
  mailer.setTo(email)
    
  mailer.send(function(err) {
    return callback.call(null)
  })
}

libraries.create = function(req, res) {

  var Validation  = require(path.join(__dirname, '..', '..', 'validators' ,'libraries')),
      data        = req.body.library || {},
      validation  = Validation(data, 'create'),
      response    = {success: false , library: null , message: 'Erro interno do servidor.'};

  if(!validation.has_errors) { 
  
    var school_id  = data.school_id;
    var newLibrary = new Library(data);

    try { 
      newLibrary._school = mongoose.Types.ObjectId(school_id);
    } catch(e) {
      console.log("[ERROR][CATCHED]".red)
      console.log(e.toString().underline.red)
    }

    // normalize librarie data
    newLibrary.postCreate(data, function() {
      newLibrary.yetExists(function(doc, exists) {

        if(exists) { 
          User.findOne({email: data.email}, function(err, user) {
            if(!user) {
              var user_data = { type: data.type, email: data.email, name: data.name, occupation: data.occupation, sex: data.sex }
              user          = new User(user_data);
              user.extra    = newLibrary.extra
            }
            user.save(function(err, _user) {
              if(!err) {
                update_conditions = { "_id": mongoose.Types.ObjectId(doc._id) }
                // if library yet exist, only update the counter and save user email
                Library.update(update_conditions, {$inc: { count: 1 }, $addToSet: { users: _user._id } }, function(err, num) {
                  extend(response , {success: true , library: doc,  message: 'Seu cadastro foi realizado com sucesso.', only_updated: true });

                  var host = [req.protocol , "://" , req.headers.host].join(''),
                      data = {host: host }

                  return mailUser(user.email, data, function() {
                    return checkSpamDoBem(doc, data,  function() {
                      doc.users = undefined;
                      return res.send(response);
                    });
                  })
                })
              }
            })

          })
        } else {
          newLibrary.save(function(err) {
            if(!err) {
              extend(response , {success: true , library: newLibrary , message: 'Seu cadastro foi realizado com sucesso.'})

              // For email 
              newLibrary.ip = req.ip
              newLibrary.origin = (req.headers.origin || req.headers.referrer || req.url)

              newLibrary.address.formatted_address = newLibrary.get('address.formatted_address');

              var mailer = require(path.join(global.app.rootAppDir, 'mailers', 'library'))(newLibrary);

              mailer.send(function(_data) {
                if(_data.error) {
                  return res.send({error: 1 , message: 'Erro no envio do email.'})
                } else {
                  mailUser(newLibrary.email, {host: res.locals.host }, function() {
                    return checkSpamDoBem(newLibrary, data,  function() {
                      return res.send(response);
                    });
                  })
                }
              })
            }
          })
        }
      })
    });
  } else {
    return res.send({error:1 , errors: validation.errors})
  }
}

libraries.search = function(req, res) {

  var Validation  = require(path.join(__dirname, '..', '..', 'validators', 'libraries_search')),
      query       = helper.clearQuery(req.param('q')),
      validation  = Validation({q: query}),
      response    = {success: false , libraries: null , message: 'Erro interno do servidor.'};

  if(!validation.has_errors) {

    var conditions = helper.libSearchFieldsQuery(query)
    var fields     = 'address.district address.state address.street address.city.name name institution_name'

    Library.find(conditions, fields, function(err, docs) {
      extend(response , {success: true , libraries: docs , message: 'Libraries successfully fetched' , total_records: docs.length})
      return res.send(response);
    })
  } else {
    return res.send({error:1 , errors: validation.errors})
  }
}

libraries.all = function(req, res,next) {
  var response        = {success: false , libraries: [] , message: 'No records found'},
      callbackExists  = typeof next == 'object';

  if(callbackExists) var callback = next.callback;

  var limit  = req.param('limit') || null ,
      offset = req.param('offset') || null,
      filter_fields = req.param('all_fields') ? null : '-created_at -updated_at -category -address.state.region -address.state.name -extra -__v -count';

  var getLibraries = function(cb) {
    var conditions = req.param('conditions') ? req.param('conditions') : {}
    var query      = Library.find(conditions , filter_fields).limit(limit).skip(offset).sort({created_at: -1 });

    query.exec(function(err, docs) {
      if(err) {
        if (err) throw err;
      }
      if((callbackExists && next.hideEmails) || !callbackExists) {
        // removing email from public
        docs.forEach(function(doc,index) {
          doc.email = undefined;
        })
      }
      return cb.call(null,err,docs);
    });
  }

  return getLibraries(function(err,docs) {
    if(docs.length === 0) {
      if(callbackExists) {
        return callback.call(null, response)
      }
      return res.send(200, response)
    } else {
      extend(response , {success: true,  libraries: docs , total_records: docs.length , message: 'Libraries successfully fetched'})
      if(callbackExists) {
        next = next.next;
        return callback.call(null, response)
      } else {
        return res.send(200, response);
      }
    }
  })
}

libraries.read = function(req, res, next) {
  var response = {success: false , library: null , message: 'Invalid Library'},
      callbackExists  = typeof next == 'object';

  if(callbackExists) var callback = next.callback;
  
  Library.findOne({_id: req.params.id }, function(err, doc) {
    if(err || doc === null) {
      if(callbackExists) {
        return callback.call(null, response)
      }
      res.send(200, response);
    } else {
      extend(response, {success: true, library: doc , message: 'Library successfully fetch'});
      
      if(callbackExists) {
        next = next.next;
        return callback.call(null, response)
      } else {
        doc.email = undefined;
        return res.send(200, response);
      }
    }
  })
}

routes.library = libraries;
module.exports = routes.library;
