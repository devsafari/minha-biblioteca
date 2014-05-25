var SectionField = (function() {
 var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

  var fieldSchema = new Schema(
    {
      key: String,
      value: {type: Array, default: []}
    }
  );

  return mongoose.model('SectionField', fieldSchema);

})

module.exports = SectionField;

