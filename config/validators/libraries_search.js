var _Validation = (function() {
  'use strict';

  var path = require('path');

  var ErrorMessages = {
    query:  'Sua pesquisa deve ter no minimo 2 caracteres.', 
  }

  return function(data) {

    var Validation = require(path.join(__dirname, 'index')),
        Validates  = new Validation();

    Validates.validates(
      [
        {validator: 'isLength', args: [(data.q || data.query) , 2,500]    , message: ErrorMessages.query  ,   key: 'query'},
      ]
    )
    var errors   = Validates.errors(),
      response   = {data: data , errors: errors , has_errors: Validates.hasErrors() }

    return response
  }
})()

module.exports = _Validation



