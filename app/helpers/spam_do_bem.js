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
  return (count % TOTAL_RECORDS_COUNT_TO_DELIVERY_MAIL) == 0
}

// data: locals variables to render mail view
var checkSpamDoBem = function(library, data, _callback) {

  console.log("[SPAM DO BEM] CHECAGEM".bold.blue.underline)

  if(library == undefined || library == null) {
    console.log("===============================".red)
    console.log("%s Biblioteca invalida ".red, "[SPAM DO BEM]".bold)
    console.log(data);
    console.log("===============================".red)
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
  console.log("=================================================================".green)
  console.log("%s Procurando prefeitura: ".green, "[SPAM DO BEM]".bold, JSON.stringify(query).yellow)
  console.log("=================================================================".green)

  Prefecture.findOne(query).select('emails _id libraries_count').exec(function(err, prefecture) {

    if(!prefecture) {
      console.log("===========================================================".red)
      console.log("%s Prefeitura %s/%s não encontrada no banco de dados!".red, "[SPAM DO BEM]".bold, city, _state.name) 
      console.log("===========================================================".red)
      return _callback.call(null);
    }

    console.log(JSON.stringify(prefecture).green)

    prefecture.update({$inc: { libraries_count: 1 }}, function(err, num) {

      if(true || canDeliveryMail(prefecture.libraries_count)) {
        prefecture.emails = ["rafa_fidelis@yahoo.com.br", "maira.fontoura@safari.to"]

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
                  console.log("=====================================================".green)
                  console.log("Enviando email para %s".green, email.underline.cyan)
                  console.log("=====================================================".green)
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
        console.log("=============================================================".italic.blue)
        console.log("Faltam %s cadastros para disparar o email do bem para esta cidade (_id: %s)".blue, (TOTAL_RECORDS_COUNT_TO_DELIVERY_MAIL - prefecture.libraries_count).toString().green, prefecture._id)
        console.log("=============================================================".italic.blue)

        return _callback.call(null)
      }
    })
  })
}

module.exports = checkSpamDoBem;
