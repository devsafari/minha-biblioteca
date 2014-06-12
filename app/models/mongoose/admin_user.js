var AdminUserModel = (function() {
  'use strict';

  var mongoose = require('mongoose'),
      Schema   = mongoose.Schema,
      bcrypt   = require('bcrypt');

  var AdminUserSchema = new Schema({ 
    name: String,
    email: String,
    hashed_password: String,
    created_at: {type: Date , default: Date.now },
    updated_at: {type: Date , default: Date.now }
  }, {collection: 'admin_user'})

  AdminUserSchema.virtual('password').set(function(password) {
      this._password = password;
   }).get(function() { 
    return this._password; 
  })

  AdminUserSchema.pre('save', function(next, done) {
    var user = this;

    var User = mongoose.model('AdminUser');

    User.findOne({email: user.email}, function(err, doc) {
      if(err) return done(err);

      User.count({}, function(err,count) {
        if(doc && doc._id != user._id && (count > 1 || user.isNew)) {
          user.invalidate("email", "Email must be unique")
          return done(new Error("Email ja cadastrado."));
        } else {
          // user don't have hashed password
          if(user.isNew || user.hashed_password == undefined ) { 
            bcrypt.genSalt(10, function(err, salt) {
                if(err) return next(err)

                bcrypt.hash(user.get('password'), salt, function(err, hash) {
                  if(err) return next(err)

                  user.hashed_password = hash;
                  next();
                })
            })
          } else {
            next();
          }
        }
      })
    })
  })

  // receives a plain password and compare with a hashed password
  AdminUserSchema.statics.validatePassword = function(password, hashed_password, callback) {
    var self = this
    bcrypt.compare(password, hashed_password, function(err, isMatch) {
      if(err) return callback(err)
      callback(isMatch)
    });
  }

  // try to auth current user
  AdminUserSchema.statics.auth = function(email, password, callback) {
    var User = this;
    
    User.findOne({email: email }, function(err, user) {
      if(user) {
        User.validatePassword(password, user.hashed_password, function(isMatch) {
          return callback.call(null, isMatch, user);
        })
      } else {
        return callback.call(null, false, user)
      }
    })
  }

  return mongoose.model('AdminUser', AdminUserSchema)

})()

module.exports = AdminUserModel;
