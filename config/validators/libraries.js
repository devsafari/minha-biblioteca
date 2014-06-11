var _Validation = (function() {
  'use strict';

  var path  = require('path');

  var validCategories = [null,"1","2"],
      validTypes      = [null,"1","2", "3"] ,
      validSex        = [null,"1","2"]  ,
      states          = require(path.join(global.app.rootAppDir, 'helpers', 'states')),
      validStates     = Object.keys(states['states']),
      validPoliticalStates = [null, "1","2"];

  var Validation = require(path.join(__dirname, 'index')),
    Validates  = new Validation();

  var ErrorMessages = {
    email:    'Por favor, digite um email válido.', 
    category: 'Por favor, selecione um categoria válida.',
    type :    'Por favor, selecione uma tipo de cadastro válido.',
    state:    'Por favor, selecione um estado válido.',
    name:     'Por favor, preencha seu nome.',
    occupation: 'Por favor, preencha sua profissão.',
    city:     'Por favor, selecione uma cidade válida.',
    political_party_name: 'Por favor, informe seu partido politico.',
    political_state: 'Por favor, selecione o seu tipo de exercicio atual.',
    address:  'Por favor, insira um endereço válido.',
    sex: 'Por favor, selecione um sexo válido'
  }

  return function(data,validation_type ) {

    var validations = {
      all: function() {
        Validates.validates([
          {validator: 'isEmail' , args: [data.email]                     , message: ErrorMessages.email        ,  key: 'email'},
          {validator: 'isIn'    , args: [data.category, validCategories] , message: ErrorMessages.category     ,  key: 'category'},
          {validator: 'isIn'    , args: [data.sex, validSex]             , message: ErrorMessages.sex          ,  key: 'sex'},
          {validator: 'isIn'    , args: [data.type , validTypes]         , message: ErrorMessages.type         ,  key: 'type'},
          {validator: 'isLength', args: [data.occupation , 3,100]        , message: ErrorMessages.occupation   ,  key: 'occupation'},
          {validator: 'isLength', args: [data.name , 3,100]              , message: ErrorMessages.name         ,  key: 'name'}
        ])
      },
      create: function() {
        var _types = [
         { values: ["1"]      , type: 1   }, // pessoas
         { values: ["2","4","5","6"], type: 2   }, // instituições
         { values: ["3"]      , type: 3   } // politicos
        ],
         type_set = false;

        _types.forEach(function(type_data,index) {
          if(type_data.values.indexOf(data.category) != -1 && !type_set) {
            data.type = type_data.type.toString();
            type_set = true;
          }
        });
        
        Validates.validates([
          {validator: 'isIn'    , args: [data.state , validStates] , message: ErrorMessages.state, key: 'state'},
          {validator: 'isLength', args: [data.city , 3,100]        , message: ErrorMessages.city , key: 'city'},
        ])

        // Cadastro de sociedade civil
        if(['1','2'].indexOf(data.type) != -1) {
          /* Validates.validates([
            {validator: 'isLength', args: [data.address , 10,100]   , message: ErrorMessages.address, key: 'address'}
          ]) */

        // Gestores públicos e Parlamentares
        } else if(data.type == '3') {
          Validates.validates([
            {validator: 'isLength', args: [data.political_party_name , 2,100]           , message: ErrorMessages.political_party_name , key: 'political_party_name'},
            {validator: 'isIn'    , args: [data.political_state , validPoliticalStates] , message: ErrorMessages.political_state      , key: 'political_state' }    
          ])
        }
      },
      update: function() {
        Validates.validates([])
      }
    }

    validations.all.call(this);

    if(validation_type && validations[validation_type]) {
      validations[validation_type].call(this);
    }

    var errors   = Validates.errors(),
      response   = {data: data , errors: errors , has_errors: Validates.hasErrors() , errorMessage: Validates.errorMessage() , states: states }

    return response
  }
})()

module.exports = _Validation



