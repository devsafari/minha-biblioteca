var SpamDoBemMailer = function(data) {
	'use strict';

  var path   = require('path')
	var Mailer = require(path.join(__dirname, 'index'));

	var mailOptions = {
    from: "Eu Quero Minha Biblioteca ✔ <contato@euquerominhabiblioteca.org.br>",
    to: "fernando.raych@safari.to", // data.email
    subject: "%s pede biblioteca em escola", 
    html_filename: "spam_do_bem.html",
    html_data: data
	}

	return new Mailer(mailOptions);
}

module.exports = SpamDoBemMailer
