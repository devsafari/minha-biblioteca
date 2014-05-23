var extend    = require('extend'),
	  path 	    = require('path'),
    Library   = require(global.app.modelsPath + '/library'),
    librariesAPI = require(path.join(__dirname, '../api/libraries')),
    util 	    = require('util');

module.exports = {

	export_data: function(req, res,next) {
		var category_id = req.param('category');
		var conditions  = category_id ?  {'category.id': category_id} : {}

		req.params = extend(req.params , {conditions: conditions, all_fields: true});

		librariesAPI.all(req,res, {
			callback: function(response) {
				res.locals = extend(res.locals, { 
					libraries: response.libraries, 
				});

				var date = new Date();

				var filename = ['Bibliotecas - ', [date.getMonth(), date.getDay(), date.getFullYear()].join("/"), "-" + (category_id || 'full') ].join('')

				var swig 	 = require('swig')
				,	template = swig.compileFile(global.app.rootAppDir + '/views/admin/libraries/export.html')
				,	output   = template(res.locals)

				res.set('Content-Disposition', ["attachment; filename='", filename, ".xls'"].join(''))
				res.send(output);

			},
			next: next,
			hideEmails: false
		})
	},

	index: function(req,res,next) {
		
		var category_id = req.params.category_id || req.param('category_id');
		var conditions  = category_id ?  {'category.id': category_id} : {}

		var getLibraries = function(count) {
			// code duplication here(same in contacts.js - i will create a helper method do avoid DRY)
			var per_page    = 20,
				pages_to_show = 3,
				current_page  = parseInt((req.param('page') <= 0 ? 1 : req.param('page')) || 1),
				skip_offset   = ((current_page - 1) * per_page), 
				total_pages   = parseInt(count / per_page) + 1,
				pagination_itens = '',
				lib 				  = new Library();

			req.params = extend(req.params , {limit: per_page , offset: skip_offset, all_fields: true, conditions: conditions});

			librariesAPI.all(req,res, {
				callback: function(response) {

					var loop_size = (pages_to_show * 2) + 1;

					for(var i=0;i< loop_size; i++) {
						var _i = (i > pages_to_show ? (i - pages_to_show) : -((pages_to_show - i)) )
						var page = (current_page + _i);
						
						if(page > 0 && page < (total_pages + 1)) {	
							pagination_itens += util.format('<li class="%s"><a href="/admin/libraries/page/%s?category_id=%s">%s</a></li>', page == current_page ? 'active' : '' , page , category_id || '', page)
						}
					}

					res.locals = extend(res.locals, { 
						libraries: response.libraries, 
						pagination_itens: pagination_itens,
						last_page: total_pages,
						first_page: 1,
						current_page: current_page,
						total_pages: total_pages,
						categories: lib.constants.CATEGORIES, 
						current_category: category_id
					});

					res.render('admin/libraries/index', {layout:'admin/layout'})
				},
				next: next,
				hideEmails: false
			});
		}

		if(req.param('q')) {
			var query		= (req.param('q')).replace(/(\?|\*|\^|\$|\]|\[)/ig, "#$1").split("#").join("\\"),
			    queryRegexp = new RegExp(query, 'i');
			    
			conditions = {$or: [
				{'address.district.name': queryRegexp }, 
				{'address.state.name':    queryRegexp}, 
				{'address.state.uf':      queryRegexp}, 
				{'address.state.region':  queryRegexp}, 
				{'address.city.name':     queryRegexp}, 
				{'email':                 queryRegexp},
				{'name':                  queryRegexp}, 
				{'institution_name':      queryRegexp}
			]}
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

		var Validation 	= require(__dirname + '/../../validators/libraries'),
			  data	   	  = req.body.library || {},
			  validation  = Validation(data),
			  response 	  = {success: false, id: null, message: 'Invalid Library' };

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