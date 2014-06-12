var SignupMailer = function(data) {
  'use strict';

  var path   = require('path')
  var Mailer = require(path.join(__dirname, 'index'));

  var mailOptions = {
    from: "Eu Quero Minha Biblioteca ✔ <contato@euquerominhabiblioteca.org.br>",
    to: "rafa_fidelis@yahoo.com.br", // data.email
    subject: "Obrigado! - Eu Quero Minha Biblioteca", 
    html_filename: "signup.html",
    html_data: data
  }

  return new Mailer(mailOptions);
}

module.exports = SignupMailer
