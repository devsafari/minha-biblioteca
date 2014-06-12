var path    = require('path')
, Latinise  = require(path.join(global.app.rootAppDir, 'helpers', 'latinise'))

var clearQuery = function(query) {
  return (query || '').replace(/(\?|\*|\^|\$|\]|\[)/ig, "#$1").split("#").join("/")
}
var escapeRegExp = function(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

var libSearchFieldsQuery = function(query) {

  query = escapeRegExp(query).latinise()

  var queryRegexp = new RegExp(query, 'i')
  var search_query = {$or: [
    {'address.district.name': queryRegexp }, 
    {'address.state.name':    queryRegexp }, 
    {'address.state.uf':      queryRegexp }, 
    {'address.state.region':  queryRegexp }, 
    {'address.city.name':     queryRegexp }, 
    {'name':                  queryRegexp }, 
    {'institution_name':      queryRegexp }
  ]}
  return search_query
}

module.exports = {
  clearQuery: clearQuery,
  libSearchFieldsQuery: libSearchFieldsQuery,
  escapeRegExp: escapeRegExp
}
