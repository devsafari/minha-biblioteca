var SectionModel = (function() {
  'use strict';

  var mongoose = require('mongoose'),
      Schema   = mongoose.Schema,
      uniqueValidator = require('mongoose-unique-validator'),
      findOrCreate    = require('mongoose-findorcreate');

  var CONSTANTS = {
    SECTIONS: ["top","signup","accessions","campaign","share","orientations","sponsors","advisers","coalizadores"]
  }

  var sectionSchema = new Schema({ 
    key:        {type: String, default: '', required: true, unique: true},
    fields:     {type: Array,  default: []},
    created_at: {type: Date ,  default: Date.now },
    updated_at: {type: Date ,  default: Date.now }
  })

  sectionSchema.plugin(uniqueValidator);
  sectionSchema.plugin(findOrCreate);

  sectionSchema.virtual('constants').get(function() {
    return CONSTANTS
  });

  sectionSchema.method('getKeyValue', function(key) {
    var section = this,
        field   = this.fields.filter(function(item) { return item.key === key }).shift();

    return !!field ? field.value : '';

  });

  sectionSchema.method('byKey', function(key,callback){
    var db = mongoose.model('Section');
  	var q  = {key: key.toLowerCase()}

  	db.findOne(q, function(err, doc) {
  		return callback.call(err,doc);
  	});
  })

	sectionSchema.method('byInnerKey', function(key, callback) {
    var db = mongoose.model('Section');
		var q = {"fields.key": key.toLowerCase()}

		db.findOne(q, function(err, doc) {
  		return callback.call(err,doc);
  	});
	});

  sectionSchema.method('postCreate', function(data, callback) {
    var self    = this;
    return callback.call(this);
  })

  return mongoose.model('Section', sectionSchema)

})()

module.exports = SectionModel;

