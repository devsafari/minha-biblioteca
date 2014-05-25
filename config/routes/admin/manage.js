var extend    = require('extend'),
    path      = require('path'),
    helper    = require(global.app.rootAppDir + '/helpers/admin_sections_helper'),
    SectionModel   = require(global.app.modelsPath + '/section');

module.exports = {
  manage_section: function(req,res,next) {
    var section_name = req.param('section');

    if(helper.validSection(section_name)) {
      SectionModel.findOrCreate({key: section_name}, function(err, section, created) {
        res.locals = extend(res.locals , {current_section: section_name, section: section});
        return res.render('admin/manage_sections/' + section_name, {layout:'admin/layout'})
      })
    } else {
      req.flash('error' , 'Página invalida');
      return res.redirect('/admin/');
    }
  },

  update_section: function(req,res,next) {
    //res.send(req.files.section.image);
    var section_name = req.param('section');

     if(helper.validSection(section_name)) {
      var fields    = extend(req.body.section, req.files.section);
      SectionModel.findOrCreate({key: section_name}, function(err, section, created) {
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