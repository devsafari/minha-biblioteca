var path    = require('path'),
    extend  = require('extend'),
    util    = require('util')

var escapeRegExp = function(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

var libsQueryCondition = function(query) {
  var query       = escapeRegExp(query),
      queryRegexp = new RegExp(query, 'i');
   

  conditions = {$or: [
    {'address.district.name': queryRegexp}, 
    {'address.state.name':    queryRegexp}, 
    {'address.state.uf':      queryRegexp}, 
    {'address.state.region':  queryRegexp}, 
    {'address.city.name':     queryRegexp}, 
    {'email':                 queryRegexp},
    {'name':                  queryRegexp}, 
    {'institution_name':      queryRegexp}
  ]}

  return conditions;
}

var paginate = function(req, total_records, options) {
  
  options = extend({per_page: 20, pages_to_show: 3, url: "", url_params: {}}, options)

  var page            = req.param('page') 
  ,   current_page    = parseInt((page <= 0 ? 1 : page) || 1)
  ,   skip_offset     = ((current_page - 1) * options.per_page)
  ,   total_pages     = parseInt(total_records / options.per_page) + 1
  ,   pages_to_show   = options.pages_to_show
      pagination_html = ''

  var url_params      = clearObject(options.url_params)
  ,   url_param       = Object.keys(url_params).map(function(key,index) { return [key, url_params[key]].join("=") }).join("&")

  var loop_size = (pages_to_show * 2) + 1;

  for(var i=0;i< loop_size; i++) {
    var j     = (i > pages_to_show ? (i - pages_to_show) : -((pages_to_show - i)) ),
        page  = (current_page + j)

    if(page > 0 && page < (total_pages + 1)) {  
      var klass         = page == current_page ? 'active' : ''
          url           = util.format(options.url, page)
          html_template = util.format('<li class="%s"><a href="%s">%s</a></li>', klass , !!url_param ? [url, url_param].join("?") : url, page)
      pagination_html += html_template
    }
  }

  return extend(options, {
    pagination_html: pagination_html,
    last_page: total_pages,
    first_page: 1,
    current_page: current_page,
    total_pages: total_pages,
    offset: skip_offset,
    total_records: total_records,
    url_param: url_param,
    limit: options.per_page
  })
}

var filenameByTimeStamp = function(basename, ext) {
  var d = new Date();
  return [basename, "-",[d.getMonth(), d.getDay(), d.getFullYear()].join("-"), ext].join('')
}

var downloadHeaders = function(res, basename, ext, output) {
  res.set('Content-Disposition', ["attachment; filename='", filenameByTimeStamp(basename, ext)].join(''))
  return res.send(output);
}

var compileTemplate = function(filename,data) {
  var swig     = require('swig')
  ,   template = swig.compileFile(filename)
  ,   output   = template(data)

  return output;
}

var compileXLSTemplate = function(dirname, data) {
  var filename  = path.join(global.app.rootAppDir, 'views', 'admin', dirname, 'export.html')
  return compileTemplate(filename, data)
}

var clearObject = function(object) {
  Object.keys(object).forEach(function(key) {
    if(!object[key]) delete object[key]
  })
  return object;
}


module.exports = {
  filenameByTimeStamp: filenameByTimeStamp,
  downloadHeaders: downloadHeaders,
  compileTemplate: compileTemplate, 
  compileXLSTemplate: compileXLSTemplate,
  libsQueryCondition: libsQueryCondition,
  clearObject: clearObject,
  paginate: paginate
}
