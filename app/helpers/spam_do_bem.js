var routes  = this
, extend    = require('extend')
, path      = require('path')
, Latinise  = require(path.join(global.app.rootAppDir, 'helpers', 'latinise'))

var SpamDoBem    = require(path.join(global.app.modelsPath, 'spam_do_bem'))


var TOTAL_RECORDS_COUNT_TO_DELIVERY_MAIL = 10

var canDeliveryMail = function(count) {
  return count % 10 == 0
}

var checkSpamDoBem = function(library, data, _callback) {
  var use_count_field = true;

  if(library == undefined || library == null) {
    return _callback.call(null);
  }

  console.log("library count = %s", library.count)
  
  // + 10 registros
  if (true || library && ((library.users && canDeliveryMail(library.users.length)) || (use_count_field && canDeliveryMail(library.count)))) {

    data = extend({library: library}, data)
    
    var mailer = require(path.join(global.app.rootAppDir , 'mailers', 'spam_do_bem'))(data)
    var Prefecture = require(path.join(global.app.modelsPath,"prefecture"))

    var city   = library.address.city.name,
        _state = library.address.state,
        uf     = _state.uf;

    var query  = {
      $and: [{
        "address.city.name": city.latinise(), 
        "address.state.uf" : uf
      }]
    }

    Prefecture.findOne(query).select('emails _id').exec(function(err, prefecture) {

      if(!prefecture) prefecture = {}

      prefecture.emails = ["rafa_fidelis@yahoo.com.br","rafaelfidelis@outlook.com","maira.fontoura@safari.to"]
    
      if(prefecture && prefecture.emails && prefecture.emails.length > 0) {

        var sendMail = function(to, callback) {
          mailer.setTo(to);
          mailer.send(function(_data) {
            callback.call(null)
          });
        }

        var sendMails = function(emails) {
          var email = emails.pop();
          if(email) {
            sendMail(email, function() {
              console.log("Enviando email para %s", email)
              var spam = new SpamDoBem({library: library._id, city: city, state: _state.name, uf: uf, institution_name: library.institution_name, email: email })
              spam.save(function(err) {
                sendMails(emails);
              })
            })
          } else {
            return _callback.call(null)
          }
        }
        sendMails(prefecture.emails || []);
      } else {
        return _callback.call(null)
      }
    })
  } else {
    console.log("=============================================================")
    console.log("Faltam %s cadastros para disparar o email do bem para esta biblioteca", (10 - library.users.length) )
    console.log("=============================================================")
    return _callback.call(null)
  }
}

module.exports = checkSpamDoBem;
