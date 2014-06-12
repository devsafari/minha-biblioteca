var path      = require('path'),
    extend    = require('extend'),
    helper    = require(path.join(global.app.rootAppDir, "helpers", "admin_helper"))

var SpamDoBem = require(path.join(global.app.modelsPath, 'spam_do_bem'));


var getConditions = function(req) {
  var uf      = req.param('uf'),
      city    = req.param('city');

  return helper.clearObject({city: city , uf: uf })
}

var getSpams  = function(conditions, options, callback) {

  options    = extend({limit: null, offset: null}, options)
  var query  = SpamDoBem.find(conditions).limit(options.limit).skip(options.offset).sort({created_at: -1 });

  query.exec(function(err, spams) {
    return callback.call(null, {spams: spams, total_records: spams.length })
  })
};

module.exports = {

  export_data: function(req,res,next) {
    var conditions = getConditions(req);
    getSpams(conditions, {}, function(data) {
      res.locals = extend(res.locals, data)
      var output = helper.compileXLSTemplate('spam_do_bem', res.locals);
      var filename = Object.keys(conditions).map(function(key) { return conditions[key] }).join("/")
      return helper.downloadHeaders(res, 'Spam do Bem' + (!!filename ? " - " + filename : ""), '.xls', output);
    })
  },

  index: function(req,res,next) {
    var conditions = getConditions(req);

    SpamDoBem.count(conditions, function(err, count) {
      var pagination_data = helper.paginate(req, count, { 
        url: "/admin/spam/page/%s/",
        url_params: conditions,
        per_page: 15
      })

      getSpams(conditions, {limit: pagination_data.limit, offset: pagination_data.offset}, function(data) {
        res.locals = extend(res.locals, data, conditions, pagination_data)
        res.render('admin/spam_do_bem/index', {layout:'admin/layout'})
      })

    })
  },
}
