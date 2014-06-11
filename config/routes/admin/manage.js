var extend    = require('extend'),
    path      = require('path'),
    helper    = require(path.join(global.app.rootAppDir, 'helpers', 'admin_sections_helper')),
    SectionModel   = require(path.join(global.app.modelsPath, 'section'));

var findSection = function(section_name,callback) {
  SectionModel.findOrCreate({key: section_name} , function(err, section, created) { 
    return callback.call(null, err, section, created);
  });
}

module.exports = {
  manage_section: function(req,res,next) {
    var section_name = req.param('section');

    if(helper.validSection(section_name)) {
      findSection(section_name, function(err, section, created) {
        var range         = helper.getRange(section)
        var last_document = range.map(function(n) { return parseInt(n) }).sort(function(a,b) { a - b }).pop() || 0;
        // locals
        res.locals             = extend(res.locals , {current_section: section_name, section: section,range: range , last_document: last_document});
        res.locals._labels     = helper._labels
        res.locals._dimensions = helper._dimensions;

        return res.render('admin/manage_sections/' + section_name, {layout:'admin/layout'})
      })
    } else {
      req.flash('error' , 'Página invalida');
      return res.redirect('/admin/');
    }
  },

  delete_section_key: function(req,res) {
    var section_name = req.params.section;
    var key  = req.params.key,
        keys = req.query._keys;

    var keys_to_remove = keys && keys.length > 2 ?  keys.split(",").concat(key) : [key];

    if(helper.validSection(section_name)) {
      SectionModel.findOne({'key': section_name, 'fields.key': key}, function(err, section) {

        if(!section) {
          return res.json(400, {success: false, message: 'Invalid section/key'});
        }

        var newFields = Object.keys(section.fields),
            fields = section.fields.map(function(field) { return field.key });

        var _fields = [];

        var removeKey = function(array, key) {
          var index = array.lastIndexOf(key);
          array.splice(index,1);
        }

        // removing the targeted keys
        keys_to_remove.forEach(function(_key) { removeKey(fields, _key); });
        // creating a new field key for document
        fields.forEach(function(_key) {
          _fields.push({key: _key, value: section.getKeyValue(_key)});
        });

        section.fields = _fields;
        
        section.save(function(err, section, numAffected) {
          return res.json({success: (numAffected > 0) });
        });
      });

    } else {
      if(req.xhr) {
        return res.json(404, {success: false, message: "Section not found"})
      } else {
        return res.redirect("/admin");
      }
    }
  },  

  update_section: function(req,res,next) {
    //res.send(req.files.section.image);
    var section_name = req.param('section');

     if(helper.validSection(section_name)) {
      var fields    = extend(req.body.section, req.files.section);
      findSection(section_name, function(err, section, created) {
        helper.prepareFields(section,fields, function(fields) {
          helper.setSectionFields(section,fields, function(section) {
            section.save(function(err) {
              if(err) {
                req.flash('error' , err.toString());
              }
              return res.redirect('/admin/manage/' + section_name);
              //return res.send(section);
            })
          });
        });
      });
    }
  }
}
