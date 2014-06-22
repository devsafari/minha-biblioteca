var SpamModel = (function() {
  'use strict';

  var mongoose = require('mongoose'),
      Schema   = mongoose.Schema;


  var spamSchema = new Schema({ 
    prefecture:    {type: Schema.Types.ObjectId, ref: 'Prefecture'},
    city:    String,
    state:   String,
    uf:      String,
    email:   String,
    created_at: {type: Date , default: Date.now },
    updated_at: {type: Date , default: Date.now },
  }, {collection: "spam_do_bem"})

  return mongoose.model('SpamDoBem', spamSchema)

})()

module.exports = SpamModel;

