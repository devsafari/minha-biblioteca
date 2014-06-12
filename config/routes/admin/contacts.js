var extend     = require('extend'),
    path       = require('path'),
    Contact    = require(path.join(global.app.modelsPath ,'contact')),
    contactAPI = require(path.join(__dirname, '..', 'api', 'contacts')),
    util       = require('util');
    contact    = new Contact();
    helper     = require(path.join(global.app.rootAppDir, "helpers", "admin_helper"))

var paramsToObject = function(req) {
    var subject_id    = req.param('subject_id'),
        area_id       = req.param('area_id'),
        question_type = req.param('question_type')

    var conditions    = helper.clearObject({area: contact.constants.AREAS[area_id], subject: contact.constants.SUBJECTS[subject_id], question_type: question_type })

    return { conditions: conditions, values: {subject_id: subject_id, area_id: area_id, question_type: question_type } }
}

module.exports = {
  show: function(req,res,next) {
    contactAPI.read(req,res , {
        callback: function(response) {
          res.locals.contact = new Contact(response.contact);
          return res.render('admin/contacts/show', {layout:'admin/layout'})
        }
    })
  },
  export_data: function(req, res,next) {
    var conditions = paramsToObject(req).conditions;
    req.params     = extend(req.params , { all_fields: true, conditions: conditions});

    contactAPI.all(req,res, {
      callback: function(response) {
        res.locals = extend(res.locals, { contacts: response.contacts });
        var output = helper.compileXLSTemplate('contacts', res.locals);
        return helper.downloadHeaders(res, 'Contatos', '.xls', output);
      },
      next: next
    })
  },
  index: function(req,res,next) {

    var data        = paramsToObject(req),
        params      = data.values,
        conditions  = data.conditions

    var getContacts = function(count) {

      var pagination_data = helper.paginate(req, count, { 
        url: "/admin/contacts/page/%s",
        url_params: params
      })
      req.params          = extend(req.params , {limit: pagination_data.per_page , offset: pagination_data.offset, all_fields: true, conditions: conditions});

      contactAPI.all(req,res, {
        callback: function(response) {          
          var view_data       = { 
            contacts: response.contacts,
            subjects: contact.constants.SUBJECTS,
            questions_types: contact.constants.QUESTIONS,
            areas: contact.constants.AREAS,
            current_subject: params.subject_id, 
            current_area: params.area_id,
            current_question_type: params.question_type
          }

          res.locals = extend(res.locals, pagination_data, view_data);
          return res.render('admin/contacts/index', {layout:'admin/layout'})
        },
        next: next
      });
    }

    Contact.count(conditions, function(err, count) {
      return getContacts(count);
    })

  },
  delete: function(req,res) {
    var response = {success: false , id: null , message: 'Invalid Contact'};
    
    Contact.remove({_id: req.params.id }, function(err, numRemoved) {
      if(err || numRemoved === 0) {
        return res.send(200, response);
      } else {
        extend(response, {success: 1, id: req.params.id , message: 'Contact successfully deleted'});
        return res.send(200, response);
      }
    })
  }
}
