var path      = require('path'),
    extend    = require('extend')

var SpamDoBem = require(path.join(global.app.modelsPath, 'spam_do_bem'));

var getSpams = function(req, callback) {
  var uf  = req.param('uf'),
      city = req.param('city');

  var conditions = {city: city , uf: uf }

  Object.keys(conditions).forEach(function(key) {
    if(!conditions[key]) delete conditions[key]
  })

  SpamDoBem.find(conditions).sort({created_at: -1}).exec(function(err, spams) {
    return callback.call(null, {city: city, uf:uf , spams: spams})
  })
};

module.exports = {

  export: function(req,res,next) {
    getSpams(req, function(data) {

      var date = new Date();
      var filename = ['Spam do Bem - ', [date.getMonth(), date.getDay(), date.getFullYear()].join("/")].join('')

      res.locals = extend(res.locals, data)

      var swig     = require('swig')
      ,   template = swig.compileFile(global.app.rootAppDir + '/views/admin/spam_do_bem/export.html')
      ,   output   = template(res.locals)

      res.set('Content-Disposition', ["attachment; filename='", filename, ".xls'"].join(''))
      return res.send(output);
    })
  },

  index: function(req,res,next) {
    getSpams(req, function(data) {
      res.locals = extend(res.locals, data)
      res.render('admin/spam_do_bem/index', {layout:'admin/layout'})
    })
  },
}
