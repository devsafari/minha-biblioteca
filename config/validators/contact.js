var _Validation = (function() {
  'use strict';

  var path              = require('path')
  var validSubjects     = ["1","2","3","4", "5"],
      validAreas        = ["1","2"],
      validQuestions    = ["1","2","3","4","5", "6","7","8", "9"];

  var Validation = require(path.join(__dirname, 'index')),
    Validates  = new Validation();

  var ErrorMessages = {
    email:    'Por favor, digite um email válido.',
    question: 'Por favor, selecione um tipo de dúvida.',
    area:     'Por favor, selecione uma área válida.',
    subject:  'Por favor, selecione um assunto válido.',
    name:     'Por favor, preencha seu nome.',
    message:  'Por favor, digite sua mensagem.'
  }

  return function(data) {

    Validates.validates(
      [
        {validator: 'isEmail' , args: [data.email]                          , message: ErrorMessages.email    , key: 'email'   },
        {validator: 'isIn'    , args: [data.question_type, validQuestions]  , message: ErrorMessages.question , key: 'question'},
        {validator: 'isIn'    , args: [data.area , validAreas]              , message: ErrorMessages.area     , key: 'area'    },
        {validator: 'isIn'    , args: [data.subject , validSubjects]        , message: ErrorMessages.subject  , key: 'subject' }, 
        {validator: 'isLength', args: [data.name , 3,100]                   , message: ErrorMessages.name     , key: 'name'    },
        {validator: 'isLength', args: [data.message , 3,9999]               , message: ErrorMessages.message  , key: 'message' }
      ]
    )

    var errors   = Validates.errors(),
      response   = { data: data , errors: errors , has_errors: Validates.hasErrors() }

    return response
  }
})()

module.exports = _Validation



