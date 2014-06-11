var ContactMailer = function(data) {
	'use strict';

  var path   = require('path')
	var Mailer = require(path.join(__dirname, 'index'));

	var mailOptions = {
    from: "Eu Quero Minha Biblioteca ✔ <contato@euquerominhabiblioteca.org.br>",
    to: "rafa_fidelis@yahoo.com.br", 
    subject: "[Site] Novo contato", 
    html_filename: "contact.html",
    html_data: data
	}

	return new Mailer(mailOptions);
}

module.exports = ContactMailer
