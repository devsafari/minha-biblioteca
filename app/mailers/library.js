var LibraryMailer = function(data) {
  'use strict';

  var Mailer = require('./index')

  var mailOptions = {
    from: "Eu Quero Minha Biblioteca ✔ <contato@euquerominhabiblioteca.org.br>",
    to: "rafa_fidelis@yahoo.com.br", 
    subject: "[Site] Novo Cadastro de Biblioteca", 
    html_filename: "library_type_" + data.type + ".html",
    html_data: data
  }

  return new Mailer(mailOptions);
}

module.exports = LibraryMailer