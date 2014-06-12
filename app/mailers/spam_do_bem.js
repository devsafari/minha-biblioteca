var SpamDoBemMailer = function(data) {
	'use strict';

  var path   = require('path')
	var Mailer = require(path.join(__dirname, 'index'));

	var mailOptions = {
    from: "Eu Quero Minha Biblioteca ✔ <contato@euquerominhabiblioteca.org.br>",
    to: "rafa_fidelis@yahoo.com.br", // data.email
    subject: "[Spam Do Bem] Eu Quero Minha Biblioteca", 
    html_filename: "spam_do_bem.html",
    html_data: data
	}

	return new Mailer(mailOptions);
}

module.exports = SpamDoBemMailer
