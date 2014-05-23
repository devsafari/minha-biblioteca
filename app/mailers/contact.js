var ContactMailer = function(data) {
	'use strict';

	var Mailer = require('./index');

	var mailOptions = {
	    from: "Eu Quero Minha Biblioteca ✔ <contato@euquerominhabiblioteca.org.br>",
	    to: "fernando.raych@safari.to", 
	    subject: "[Site] Novo contato", 
	    html_filename: "contact.html",
	    html_data: data
	}

	return new Mailer(mailOptions);
}

module.exports = ContactMailer