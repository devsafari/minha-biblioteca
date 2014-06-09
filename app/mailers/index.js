var Mailer = (function() {

	'use strict';

	var nodemailer = require("nodemailer"),
		  auth 	     = require('./auth');

	var smtpTransport = nodemailer.createTransport("SMTP", {
	    service: "Gmail",
	    auth: auth
	});

	var mailOptions = {};

	return function(mailOptions) {

		mailOptions = mailOptions;
		var sendMail = function(mailOptions,callback) {
			return smtpTransport.sendMail(mailOptions, function(error, response){
				callback.call(callback, {error: error , response: response});
			})
		}

		return {
			setTo: function(to_address) {
				mailOptions.to = to_address
			},
			send: function(callback) {
				if(mailOptions.html_filename){
					var mu 	 = require('mu2'),
				  		util = require('util'),
						parsedHTML = "";

					mu.root = global.app.rootAppDir + '/views/mailers/';

					var strftime = require('strftime');
					
					mailOptions.html_data.date = strftime("%d/%m/%Y %H:%M:%S");
				
					var stream = mu.compileAndRender(mailOptions.html_filename , mailOptions.html_data).on('data', function(_data) {
						parsedHTML += _data.toString();
					}).on('end', function() {
						mailOptions.html = parsedHTML;
						return sendMail(mailOptions, callback);
					});
					return true
				}
				return sendMail(mailOptions, callback);	
			}
		}
	}
})();

module.exports = Mailer;