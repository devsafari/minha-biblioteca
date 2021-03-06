var path      = require('path')
var AdminUser = require(path.join(global.app.modelsPath, 'admin_user')),
    extend    = require('extend');

module.exports = {
  index: function(req,res,next) {
    AdminUser.find({} , function(err, users) {
      res.locals = extend(res.locals, { users: users });
      return res.render('admin/users/index', {layout:'admin/layout'})
    })
  },

  edit: function(req,res,next) {
    AdminUser.findOne({_id: req.params.id }, function(err, doc) {
      if(doc) {
        res.locals.user = new AdminUser(doc)
        return res.render('admin/users/edit', {layout:'admin/layout'})
      }
      return res.redirect("/admin/users/")
    })
  },

  new: function(req,res,next) {
    res.render('admin/users/new', {layout:'admin/layout'})
  },

  create: function(req,res) {
    var Validation  = require(path.join(__dirname,  '..', '..', 'validators', 'users')),
        data        = req.body.user || {},
        validation  = Validation(data),
        response    = {success: false , user: null , message: 'Database Error'};

    if(!validation.has_errors) {
      
      var newUser = new AdminUser(data);
      newUser.save(function(err) {
        if(err) {
          response.message = err.toString();
          req.flash('error' ,  response.message)
          return res.redirect('/admin/users/new')
        } else {
          response = extend(response, {success: true, message: 'User successfully created', user: newUser});
          req.flash('success' ,  response.message)
          return res.redirect('/admin/users');
        }
      })
    } else {
      req.flash('error' ,  validation.errorMessage)
      return res.redirect('/admin/users/new')
    }

  },
  delete: function(req,res,next) {
    var response = {success: false , id: null , message: 'Invalid user'};
    
    AdminUser.remove({_id: req.params.id }, function(err, numRemoved) {
      if(err || numRemoved === 0) {
        return res.send(200, response);
      } else {
        extend(response, {success: 1, id: req.params.id , message: 'User successfully deleted'});
        return res.send(200, response);
      }
    })
  },
  
  update: function(req,res,next) {
    var Validation = require(path.join(__dirname, '..', '..', 'validators', 'users')),
      data = req.body.user || {},
      validation = Validation(data);

    if(!validation.has_errors) {
      AdminUser.findOne({_id: req.params.id }, function(err, user) {
        // if user exists
        if(user) {
          // update main data
          user.name = data.name
          user.email = data.email

          // if password changed
          if(data.password) {
            if(data.password_confirmation == data.password) {
              user.hashed_password = undefined; // to encrypt again in User model
              user.password = data.password
            }
          }

          user.save(function(err) {
            if(err) {
              req.flash('error' ,  err.toString());
              return res.redirect('/admin/user/edit/' + user._id)
            }
            req.flash('success' ,  'Usuário atualizado com sucesso')
            return res.redirect('/admin/users');
          });
        }
      });
    } else {
      req.flash('error' ,  validation.errorMessage)
      return res.redirect('/admin/user/edit/' + req.params.id)
    }
  }
}
