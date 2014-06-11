var routes  = this
, libraries = {}
, extend    = require('extend')
, path      = require('path')
, Library   = require(path.join(global.app.modelsPath, 'library'))
, User      = require(path.join(global.app.modelsPath, 'user'))
, mongoose  = require('mongoose')
, checkSpamDoBem = require(path.join(global.app.rootAppDir, 'helpers', 'spam_do_bem'));




libraries.create = function(req, res) {

  var Validation  = require(path.join(__dirname, '..', '..', 'validators' ,'libraries')),
      data        = req.body.library || {},
      validation  = Validation(data, 'create'),
      response    = {success: false , library: null , message: 'Erro interno do servidor.'};

  if(!validation.has_errors) { 
  
    var school_id  = data.school_id;
    var newLibrary = new Library(data);

    newLibrary._school = mongoose.Types.ObjectId(school_id);

    // normalize librarie data
    newLibrary.postCreate(data, function() {
      newLibrary.yetExists(function(doc, exists) {

        if(exists) { 
          User.findOne({email: data.email}, function(err, user) {
            if(!user) {
              // if library yet exist, only update the counter and save user email
              var user_data = { type: data.type, email: data.email, name: data.name, occupation: data.occupation, sex: data.sex }
              user         = new User(user_data);
              user.extra   = newLibrary.extra
            }
            user.save(function(err, _user) {
              if(!err) {
                update_conditions = { "_id": mongoose.Types.ObjectId(doc._id) }
                Library.update(update_conditions, {$inc: { count: 1 }, $addToSet: { users: _user._id } }, function(err, num) {
                  extend(response , {success: true , library: doc,  message: 'Seu cadastro foi realizado com sucesso.', only_updated: true });

                  var host = [req.protocol , "://" , req.headers.host].join('')

                  checkSpamDoBem(doc, {host: host },  function() {
                    doc.users = undefined;
                    return res.send(response);
                  });

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
                  return res.send(response);
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
      query       = (req.param('q') || '').replace(/(\?|\*|\^|\$|\]|\[)/ig, "#$1").split("#").join("/"),
      validation  = Validation({q: query}),
      queryRegexp = new RegExp(query, 'i'),
      response    = {success: false , libraries: null , message: 'Erro interno do servidor.'};

  if(!validation.has_errors) {
    // mongo db query format  
    var search_query = {$or: [
      {'address.district.name': queryRegexp }, 
      {'address.state.name': queryRegexp}, 
      {'address.state.uf': queryRegexp}, 
      {'address.state.region': queryRegexp}, 
      {'address.city.name': queryRegexp}, 
      {'name': queryRegexp}, 
      {'institution_name': queryRegexp}
    ]}

    Library.find(search_query, 'address.district address.state address.street address.city.name name institution_name', function(err, docs) {
      extend(response , {success: true , libraries: docs , message: 'Libraries successfully fetched' , total_records: docs.length})
      return res.send(response);
    })
  } else {
    return res.send({error:1 , errors: validation.errors})
  }
}

libraries.all = function(req, res,next) {
  var response    = {success: false , libraries: [] , message: 'No records found'},
      callbackExists  = typeof next == 'object';

  if(callbackExists) var callback = next.callback;

  var limit  = req.param('limit') || null ,
      offset = req.param('offset') || null,
      filter_fields = req.param('all_fields') ? null : '-created_at -updated_at -category -address.state.region -address.state.name -extra -__v -count';

  var getLibraries = function(cb) {
    var conditions = req.param('conditions') ? req.param('conditions') : {}
    var query = Library.find(conditions , filter_fields).limit(limit).skip(offset);

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
        res.send(200, response);
        
      }
    }
  })
}

routes.library = libraries;
module.exports = routes.library;
