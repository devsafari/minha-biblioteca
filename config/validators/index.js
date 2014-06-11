var _Validator = (function() {
  'use strict';

  var Validator = require('validator');

  return function() {
    var _errors = {};
    return {
      validates: function(options) {
        var self = this;
        if(options instanceof Array) {
          return options.forEach(function(_options) {
            return self.validates(_options);
          })
        }
        var args = options.args || [];
        if(!Validator[options.validator].apply(Validator, args)) {          
          if(_errors[options.key] == undefined) {
            _errors[options.key] = options.message
          }
        } else {
          _errors[options.key] = undefined;
        }
      },
      errors: function() {
        return _errors;
      },
      hasErrors: function() {
        var errors_keys  =  Object.keys(_errors);
        return (errors_keys.map(function(index) { return _errors[index] != undefined }).indexOf(true) != -1)
      },
      errorMessage: function() {
        var error = '';
        Object.keys(_errors).forEach(function(key) {
          if(_errors[key] != undefined) {
            error += _errors[key];
          }
        })

        return error;
      }
    }
  }
})()

module.exports = _Validator;
