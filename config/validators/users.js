var _Validation = (function() {
  'use strict';

  var path       = require('path')
  var Validation = require(path.join(__dirname, 'index')),
    Validates  = new Validation();

  var ErrorMessages = {
    email: 'Por favor, digite um email válido.', 
    name: 'Por favor, preencha seu nome.',
    password_confirmation: 'As senhas não são iguais'
  }

  return function(data) {


    Validates.validates(
      [
        {validator: 'isEmail', args: [data.email], message: ErrorMessages.email, key: 'email'},
        {validator: 'isLength', args: [data.name , 3,100], message: ErrorMessages.name, key: 'name'},
        {validator: 'equals',  args: [data.password, data.password_confirmation], message: ErrorMessages.password_confirmation, key: 'password'}
      ]
    )

    var errors = Validates.errors(),
      response = {data: data , errors: errors , has_errors: Validates.hasErrors(), errorMessage: Validates.errorMessage() }

    return response
  }
})()

module.exports = _Validation
