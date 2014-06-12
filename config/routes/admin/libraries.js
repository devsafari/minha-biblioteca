var extend       = require('extend'),
    path         = require('path'),
    Library      = require(path.join(global.app.modelsPath, 'library')),
    librariesAPI = require(path.join(__dirname, '..', 'api', 'libraries')),
    util         = require('util');

module.exports = {

  export_data: function(req, res,next) {
    var category_id = req.param('category');
    var conditions  = category_id ?  {'category.id': category_id} : {}

    req.params = extend(req.params , {conditions: conditions, all_fields: true});

    librariesAPI.all(req,res, {
      callback: function(response) {
        res.locals   = extend(res.locals, { libraries: response.libraries });
        
        var output   = helper.compileXLSTemplate('libraries', res.locals)
        ,   types    = ['cidadãos', 'poder-público', 'completo']
        ,   filename = ['Bibliotecas', types[(category_id || types.length) - 1]].join("-")

        return helper.downloadHeaders(res, filename, '.xls', output);
      },
      next: next,
      hideEmails: false
    })
  },

  index: function(req,res,next) {
      
    var category_id = req.param('category_id');
    var conditions  = helper.clearObject({'category.id': category_id})

    var getLibraries = function(count) {
      
      var lib             = new Library();
      var pagination_data = helper.paginate(req, count, { 
        url: "/admin/libraries/page/%s/",
        url_params: {category_id: category_id, q: req.param('q')} 
       })

      req.params          = extend(req.params , {limit: pagination_data.per_page , offset: pagination_data.offset, all_fields: true, conditions: conditions});

      librariesAPI.all(req,res, {
        callback: function(response) {
          var data = res.locals = extend(res.locals, pagination_data, { 
            libraries: response.libraries, 
            categories: lib.constants.CATEGORIES, 
            current_category: category_id,
            search_query: req.param('q')
          });

          return res.render('admin/libraries/index', {layout:'admin/layout'})
        },
        next: next,
        hideEmails: false
      });
    }

    if(req.param('q')) {
      conditions = helper.libsQueryCondition(req.param('q'))
    }
    Library.count(conditions, function(err, count) {
      return getLibraries(count);
    })
  },

  show: function(req,res) {
    librariesAPI.read(req,res , {
      callback: function(response) {
        res.locals.library = new Library(response.library);
        res.render('admin/libraries/show', {layout:'admin/layout'})
      }
    })
  },

  edit: function(req,res) {
    librariesAPI.read(req,res , {
      callback: function(response) {
        res.locals.library = new Library(response.library);
        res.render('admin/libraries/edit', {layout:'admin/layout'})
      }
    });
  },
  delete: function(req,res) {
    var response = {success: false , id: null , message: 'Invalid Library'};
    
    Library.remove({_id: req.params.id }, function(err, numRemoved) {
      if(err || numRemoved === 0) {
        res.send(200, response);
      } else {
        extend(response, {success: 1, id: req.params.id , message: 'Library successfully deleted'});
        res.send(200, response);
      }
    })
  },
  update: function(req,res) {

    var Validation  = require(path.join(__dirname, '..', '..', 'validators', 'libraries')),
          data        = req.body.library || {},
          validation  = Validation(data),
          response    = {success: false, id: null, message: 'Invalid Library' };

    if(!validation.has_errors) { 
      response.id = req.params.id;

      Library.findById(response.id, function(err, library) {
        // normalize data before update
        library.beforeUpdate(data, function() {
          this.save(function(err, library,numAffected) {
            if(err) {
              req.flash('error' ,  response.message)
              return res.redirect('/admin/library/edit/' + response.id)
            } else {
              extend(response, {success: true, library: library , message: 'Library successfully updated'});
              req.flash('success' , response.message)
              return res.redirect('/admin/library/' + response.id)
            }
          })
        })
      })
    } else {
      req.flash('error' ,  validation.errorMessage);
      return res.redirect('/admin/library/edit/' + req.params.id)
    }
  },
  new: function(req,res) {
  },
  create: function(req,res) {
  }
}
