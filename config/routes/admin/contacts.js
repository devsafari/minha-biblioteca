var extend     = require('extend'),
    path       = require('path'),
    Contact    = require(path.join(global.app.modelsPath ,'contact')),
    contactAPI = require(path.join(__dirname, '..', 'api', 'contacts')),
    util       = require('util');
    contact    = new Contact();

var getConditions = function(req) {
    var subject_id = req.params.subject_id || req.param('subject_id'),
        area_id    = req.params.area_id    || req.param('area_id'),
        question_type = req.params.question_type || req.param('question_type')

    var _conditions  = {area: contact.constants.AREAS[area_id], subject: contact.constants.SUBJECTS[subject_id], question_type: question_type },
        conditions   = {}

    Object.keys(_conditions).forEach(function(key) {
        if(_conditions[key]) {
            conditions[key] = _conditions[key];
        }
    });

    return {conditions: conditions, values: {subject_id: subject_id, area_id: area_id, question_type: question_type} }
}

module.exports = {
  show: function(req,res,next) {
    contactAPI.read(req,res , {
        callback: function(response) {
          res.locals.contact = new Contact(response.contact);
          res.render('admin/contacts/show', {layout:'admin/layout'})
        }
    })
  },
  export_data: function(req, res,next) {
    var conditions    = getConditions(req).conditions;

    req.params = extend(req.params , { all_fields: true, conditions: conditions});

    contactAPI.all(req,res, {
      callback: function(response) {
        res.locals = extend(res.locals, { 
            contacts: response.contacts, 
        });

        var date = new Date();

        var filename = ['Contatos - ', [date.getMonth(), date.getDay(), date.getFullYear()].join("/")].join('')

        var swig    = require('swig')
        ,   template = swig.compileFile(global.app.rootAppDir + '/views/admin/contacts/export.html')
        ,   output = template(res.locals)

        res.set('Content-Disposition', ["attachment; filename='", filename, ".xls'"].join(''))
        res.send(output);
      },
      next: next
    })
  },
  index: function(req,res,next) {

    var _conditions = getConditions(req),
        conditions  = _conditions.conditions

    var getContacts = function(count) {
      // code duplication here(same in libraries.js - i will create a helper method do avoid DRY)
      var per_page      = 20,
          pages_to_show = 3,
          current_page  = parseInt((req.param('page') <= 0 ? 1 : req.param('page')) || 1),
          skip_offset   = ((current_page - 1) * per_page), 
          total_pages   = parseInt(count / per_page) + 1,
          pagination_itens = '';

      req.params = extend(req.params , {limit: per_page , offset: skip_offset, all_fields: true, conditions: conditions});

      contactAPI.all(req,res, {
        callback: function(response) {

          var loop_size = (pages_to_show * 2) + 1;

          for(var i=0;i< loop_size; i++) {
            var _i   = (i > pages_to_show ? (i - pages_to_show) : -((pages_to_show - i)) )
            var page = (current_page + _i);
            if(page > 0 && page < (total_pages + 1)) {  
              pagination_itens += util.format('<li class="%s"><a href="/admin/contacts/page/%s">%s</a></li>', page == current_page ? 'active' : '' , page , page)
            }
          }

          res.locals = extend(res.locals, { 
            contacts: response.contacts, 
            pagination_itens: pagination_itens,
            last_page: total_pages,
            first_page: 1,
            current_page: current_page,
            total_pages: total_pages,
            subjects: contact.constants.SUBJECTS,
            current_subject: _conditions.values.subject_id, 
            areas: contact.constants.AREAS,
            current_area: _conditions.values.area_id,
            questions_types: contact.constants.QUESTIONS,
            current_question_type: _conditions.values.question_type
          });

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
        res.send(200, response);
      } else {
          extend(response, {success: 1, id: req.params.id , message: 'Contact successfully deleted'});
        res.send(200, response);
      }
    })
  }
}
