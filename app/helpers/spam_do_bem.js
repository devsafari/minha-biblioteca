var routes  = this
, extend    = require('extend')
, path      = require('path')
, colors    = require('colors')
, Latinise  = require(path.join(global.app.rootAppDir, 'helpers', 'latinise'))
, helper    = require(path.join(global.app.rootAppDir, 'helpers', 'admin_helper'))

var SpamDoBem  = require(path.join(global.app.modelsPath, 'spam_do_bem'))
,   Prefecture = require(path.join(global.app.modelsPath,"prefecture"))
,   Library    = require(path.join(global.app.modelsPath,"library"));

var TOTAL_RECORDS_COUNT_TO_DELIVERY_MAIL = 10
var canDeliveryMail = function(count) {
  return (count > 0 && ((count % TOTAL_RECORDS_COUNT_TO_DELIVERY_MAIL) == 0))
}

// data: locals variables to render mail view
var checkSpamDoBem = function(library, data, _callback) {

  if(library == undefined || library == null) {
    return _callback.call(null);
  }

  data            = extend({library: library}, data)
  var mailer      = require(path.join(global.app.rootAppDir , 'mailers', 'spam_do_bem'))(data)

  var city        = library.address.city.name,
      _state      = library.address.state,
      uf          = _state.uf;

  var query       = {
    $and: [{
      "address.city.name": city.latinise(), 
      "address.state.uf" : uf
    }]
  }

  Prefecture.findOne(query).select('emails _id libraries_count').exec(function(err, prefecture) {

    if(!prefecture) {
      return _callback.call(null);
    }

    prefecture.update({$inc: { libraries_count: 1 }}, function(err, num) {

      if(canDeliveryMail(prefecture.libraries_count)) {
        Library.find(query, function(err, libraries) {
          var attachment_template  = path.join(global.app.rootAppDir, 'views', 'mailers', 'school.txt');
          var attachment_content   = '';

          for(library in libraries) {
            library = libraries[library]
            if(library.institution_name) {
              attachment_content += helper.compileTemplate(attachment_template, library)
            }
          } 

          mailer.addAttachment({ fileName:  "instituições.txt", contents: attachment_content, contentType: "text/plain" })

          if(prefecture.emails && prefecture.emails.length > 0) {
            mailer.setOptions({subject: city.toString() + " pede biblioteca em escola" })
            var sendMail = function(to, callback) {
              mailer.setTo(to);
              mailer.send(function(_data) {
                return callback.call(null)
              });
            }

            var sendMails = function(emails) {
              var email   = emails.pop();
              if(email) {
                sendMail(email, function() {
                  var spam = new SpamDoBem({prefecture: prefecture._id, city: city, state: _state.name, uf: uf, email: email })
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
        return _callback.call(null)
      }
    })
  })
}

module.exports = checkSpamDoBem;
