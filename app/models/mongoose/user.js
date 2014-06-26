var userModel = (function() {
  'use strict';

  var mongoose = require('mongoose'),
      Schema   = mongoose.Schema;


  var userSchema = new Schema({ 
    type: Number,
    name:  String,
    email: {type: String, index: true},
    occupation: String,
    institution_name: String,
    sex: String,
    extra: {
      type_label: String,
      political_party_name: String,
      political_state: Number
    },
    created_at: {type: Date , default: Date.now },
    updated_at: {type: Date , default: Date.now },
  })

  return mongoose.model('User', userSchema)

})()

module.exports = userModel;

