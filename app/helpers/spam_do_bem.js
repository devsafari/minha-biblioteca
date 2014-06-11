var routes  = this
, extend    = require('extend')
, path      = require('path');


var TOTAL_RECORDS_COUNT_TO_DELIVERY_MAIL = 10

var canDeliveryMail = function(count) {
  return count % 10 == 0
}

var checkSpamDoBem = function(library, data, _callback) {
  var use_count_field = true;

  console.log("library count = %s", library.count)
  

  // + 10 registros
  if (library && ((library.users && canDeliveryMail(library.users.length)) || (use_count_field && canDeliveryMail(library.count)))) {

    data = extend({library: library}, data)
    
    var mailer = require(path.join(global.app.rootAppDir , 'mailers', 'spam_do_bem'))(data)
    var Prefecture = require(path.join(global.app.modelsPath,"prefecture"))

    Prefecture.findOne({
      $and: [{ 
        "address.city.name": library.address.city.name, 
        "address.state.uf" : library.address.state.uf
      }]
    }).select('emails _id').exec(function(err, prefecture) {
      if(prefecture && prefecture.emails && prefecture.emails.length > 0) {
        prefecture.emails = ["rafa_fidelis@yahoo.com.br", "rafaelfid3lis@gmail.com","rafaelfidelis@outlook.com"]

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
              sendMails(emails);
            })
          } else {
            _callback.call(null)
          }
        }
        sendMails(prefecture.emails || []);
      }
    })
  } else {
    console.log("=============================================================")
    console.log("Faltam %s cadastros para disparar o email do bem para esta biblioteca", (10 - library.users.length) )
    console.log("=============================================================")
    _callback.call(null)
  }
}

module.exports = checkSpamDoBem;
