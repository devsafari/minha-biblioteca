var path      = require('path'),
    uploader  = require(path.join(global.app.rootAppDir, 'helpers', 'upload'));

var validSection      = function(_section) {
  var SectionModel    = require(path.join(global.app.modelsPath, 'section'))

  var SECTIONS = (new SectionModel()).constants.SECTIONS,
      section  = _section.toLowerCase(),
      isValid  = (SECTIONS.indexOf(section) != -1);

  return isValid;
}

var prepareFields = function(section,fields,callback) {
  var _fields = [];
  for(key in fields) {
    var value = fields[key];
    value = !!value.path ? ((!!value.name && !!value.originalFilename) ? {value: value.path, image: !!value.type.match(/^image\/(jpg|png|jpeg)$/), upload: true} : null ) : {value: value}
    if(value) { 
      _fields.push({ key: key, value: value });
    } else {
      _fields.push({key: key, value: {value: section.getKeyValue(key)}});
    }
  }
  if(!!callback) {
   return callback.call(null, _fields);
  }
  return _fields;
}

var filterUploads = function(fields) {
  var _filters = fields.filter(function(field) { return [field.value.upload, field.value.image].indexOf(true) != -1 });
  return _filters;
}


var normalizeFields = function(section,fields) {
  var _fields = [];
  fields.forEach(function(_field, index) {
    var key       = _field.key,
        value     = _field.value.value,
        key_value = section.getKeyValue(key);

    // value yet exists
    if(key_value) {
      if(value && value != key_value) {
        _fields.push({key: key , value: value})
      } else {
        _fields.push({key: key, value: key_value})
      }
    // set value from params
    } else {
      _fields.push({key: key, value: value})
    }
  });
  return _fields;
}

var uploadAllFiles = function(fields, callback) {
  var uploadFields = filterUploads(fields),
      totalUploads = uploadFields.length,
      totalUploaded=0;

  if(totalUploads == 0) {
    return callback.call(null, fields);
  }

  var checkComplete = function(err,field,file) {
    if(!err) {
      field.value = {value: file.file.path + file.file.basename};
      totalUploaded++;
      return (totalUploaded >= totalUploads);
    }
  }

  uploadFields.forEach(function(field) {
    var tempImagePath = field.value.value,
        isImageUpload = (field.value.image === true);

    if(isImageUpload) {
      uploader.uploadAndCreateThumb(tempImagePath, function(err,f) {
        if(checkComplete(err,field,f)) {
           return callback.call(null, fields);
        }
      })
    } else {
      uploader.upload(tempImagePath, function(err,f) {
        if(checkComplete(err,field,f)) {
           return callback.call(null, fields);
        }
      })
    }
  });
}

var setSectionFields = function(section, fields,callback) {
  uploadAllFiles(fields, function(fields) {
    var normalizedFields = normalizeFields(section,fields);
    section.fields = normalizedFields;
    return callback.call(null, section);
  })
}

var getIdByKeysInitials = function(section) {
  var base_fields = {
    sponsors: "sponsor_link_",
    coalizadores: "coalizador_link_",
    advisers: "adviser_link_",
    campaign: "text_"
  }
  var base  = base_fields[section.key],
      _keys = [];

  if(base) {
    var fields = section.fields.map(function(field) { return field.key });
    var regexp = new RegExp("^" + base, 'i');

    fields.forEach(function(key, index) {
      var found = key.match(regexp);
      if(found && section.getKeyValue(key)) {
        _keys.push(key.replace(found.shift(), ''))
      }
    })
  }
  
  return _keys;
}

var getRange = function(section) {
  return getIdByKeysInitials(section);
}

module.exports = {
  validSection: validSection,
  prepareFields: prepareFields,
  filterUploads: filterUploads,
  normalizeFields: normalizeFields,
  uploadAllFiles: uploadAllFiles,
  setSectionFields: setSectionFields,
  _labels: { orientationsFilenames: { citizens: "Cidadãos", public_managers: "Gestores Públicos" }},
  _dimensions: {share: [null, "250x250px", "250x250px", "728x90px", "167x74px", "164x74px"], sponsors: "120x120px",advisers: "120x120px" , coalizadores: "90x90px" },
  getRange: getRange
}
