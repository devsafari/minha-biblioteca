var SpamModel = (function() {
  'use strict';

  var mongoose = require('mongoose'),
      Schema   = mongoose.Schema;


  var spamSchema = new Schema({ 
    library: {type: Schema.Types.ObjectId, ref: 'Library'},
    city:    String,
    state:   String,
    uf:      String,
    email:   String,
    institution_name: String, 
    created_at: {type: Date , default: Date.now },
    updated_at: {type: Date , default: Date.now },
  }, {collection: "spam_do_bem"})

  return mongoose.model('SpamDoBem', spamSchema)

})()

module.exports = SpamModel;

