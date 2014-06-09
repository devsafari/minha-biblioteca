var ContactModel = (function() {
  'use strict';

  var mongoose = require('mongoose'),
      Schema   = mongoose.Schema

  var CONSTANTS = {
    SUBJECTS: {
      "1": "Parcerias",
      "2": "Dúvidas sobre a campanha",
      "3": "Pedidos de materias",
      "4": "Dúvidas sobre cadastro",
      "5": "Problemas no site"
    },

    AREAS: {
      "1": "Cidadãos",
      "2": "Poder Público",
    },

    QUESTIONS: {
      "1": "Acervo",
      "2": "Esclarecimento",
      "3": "Promoção de leitura",
      "4": "Coalização",
      "5": "Pedido de Camiseta",
      "6": "Problemas no site",
      "7": "Espaço e infraestrutura",
      "8": "Pedido de doação",
      "9": "Não sabe informar",
    }
  }

  var contactSchema = new Schema(
  { 
    name: String,
    email: String,
    subject: String,
    area: String,
    question_type: Number,
    message: String,
    ip: String,
    origin: String,
    created_at: {type: Date , default: Date.now },
    updated_at: {type: Date , default: Date.now }
  })

  contactSchema.virtual('constants').get(function() {
    return CONSTANTS
  });


  contactSchema.method('postCreate', function(data, callback) {
    var self    = this;

    self.subject  = CONSTANTS.SUBJECTS[data.subject];
    self.area     = CONSTANTS.AREAS[data.area];
    self.question   = CONSTANTS.QUESTIONS[data.question_type];
    self.message  = data.message.replace(/\r\n/g, '<br/>');

    callback.call(this);
  })

  return mongoose.model('Contact', contactSchema)

})()

module.exports = ContactModel;

