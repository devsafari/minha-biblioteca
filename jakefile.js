(function() {
	'use strict';

	var path = require('path'),
		User = require(path.join(__dirname, 'app', 'models', 'mongoose' , 'user')),
		Library = require(path.join(__dirname, 'app', 'models', 'mongoose' , 'library')),
		config = require(path.join(__dirname , 'config')),
		mongoose = require('mongoose'),
		glob = require('glob'),
		fs = require('fs');

	var loadJSON = function(json_filename) {
		var file_data = fs.readFileSync(path.join(__dirname , 'db', 'seeds', json_filename + '.json') , 'utf8');
		return JSON.parse(file_data)
	}

	namespace('db', function() {
		config.setupDatabase(mongoose);

		desc('Seed admin database')
		task('seed', {async: true}, function() {


			var users = [
				{
					name: 'Eu quero minha biblioteca',
					email: 'admin@ecofuturo.org.br',
					password: 'm4k3u557r0n63r'
				}
			]
			users.forEach(function(data,index) {

				var newUser = new User(data);

				newUser.save(function(err) {
					if(err) {
						console.log('Error, maybe user with email=%s yet exists', data.email)
						console.log('[ERROR]', err)
					} else {
						console.log('User with email=%s and password=%s successfully created', data.email, data.password)					
					} 
					// call complete listener when all users has sucessfully added
					if((index + 1) == users.length) {
						complete();
					}
				})
			})
		})

		desc('Clear database')
		task('clear', {async: true}, function() {
			var collection = process.env.collection;
			if(!collection) {
				throw(new Error('collection must be informed, use collection=collection_name'))
			}
			mongoose.connection.collections[collection].drop(function(err) {
				console.log('collection %s dropped', collection);
				complete();
			})
		})
	})

	namespace('json', function() {
		desc('Read and parse old json structure to new app model')
		task('generate', {async: true}, function() {

			var jsonData = {
				cities: loadJSON('old-seeds/cidade'),
				libraries: loadJSON('old-seeds/bibliotecas'),
				states: loadJSON('old-seeds/estado'),
				users: loadJSON('old-seeds/usuario'),
			}

			var librariesData = [];

			var _s = require('underscore.string');

			jsonData.libraries.forEach(function(library, index) {
				var city_id 	= parseInt(library.idcidade),
					city_data 	= jsonData.cities[(city_id - 1)]

				if(city_id && city_data.estado) {
					var city_name 	= city_data.nome,
						state_id 	    = parseInt(city_data.estado),
						state_data    = jsonData.states[(state_id - 1)],
						address 	    = [city_name, state_data.nome].join(' - ');

					var libraryData = {
						address: _s.titleize(address), 
						state: state_data.uf,
						// the shit below is because project has changed a lot of time, i haven't time to make it better
						category: library.tipo == '1' ? '1' : '2',
						type: library.tipo == '1' ? '1' : '2',
						political_state: library.exercicio == '1' ? '1' : '2',
						// ok, shit ends here
						city: _s.titleize(city_name), 
						name: _s.titleize(library.nome), 
						email: library.email.toLowerCase(),
						occupation: _s.titleize(library.profissao),
						coordinates: {
							lat: city_data.lat,
							lng: city_data.lng
						}
					}
					// project changes cause this
					if(librariesData.type == '2') {
						libraryData.political_party_name = _s.titleize(library.instituicao)
					} else {
						libraryData.institution_name = _s.titleize(library.instituicao)
					}

					librariesData.push(libraryData)
				}
			})

			var json_data    =  JSON.stringify(librariesData),
				json_filename  = path.join(__dirname, 'db', 'seeds', 'seed_libraries.json');

			fs.writeFile(json_filename, json_data , function(err) {
			    if(err) { console.log(err);
			    } else { console.log("File saved: %s", json_filename); }
			    complete();
			}); 
		})

		desc('Import generated JSON')
		task('import_libraries', {async: true}, function() {

			console.time('Import libraries JSON');

			config.setupDatabase(mongoose, function() {
				global.app = {rootAppDir: __dirname + '/app'};

				var librariesData = loadJSON('seed_libraries');

				var addLibrary = function(library_data, callback) {
					var newLibrary 	= new Library(library_data)

					if(library_data == undefined) {
						return callback.call(null,newLibrary)
					}

					newLibrary.postCreate(library_data, function(data) {
						callback.call(null, newLibrary)
					})
				}

				var totalLibraries 		= process.env.MAX || librariesData.length,
					totalLibrariesAdded = 0,
					libraryData;


				console.log('Hold on, we will import %s libraries, this can take a while.', totalLibraries)

				var checkCompleted = function() {
					if(++totalLibrariesAdded >= totalLibraries) {
						console.timeEnd('Import libraries JSON');
						complete();
					}
				}
				while(libraryData = librariesData.pop()) {
					var newLibrary = new Library(libraryData);

					newLibrary.postCreate(libraryData, function() {
						newLibrary.address.coordinates = libraryData.coordinates;
						newLibrary.yetExists(function(doc, exists) {
							if(exists) {
								console.log('Library yet exists =', totalLibrariesAdded);
								checkCompleted();
							} else {
								this.save(function(err) {
									console.log("%s/%s", totalLibrariesAdded, totalLibraries)
									checkCompleted();
								})
							}
						})
					// do not geocode using google maps api(cuz we yet have lat/long)
					}, {geocode: false})
				}
			});
		})
	})

	jake.addListener('complete', function () {
	  process.exit();
	  mongoose.connection.close();
	});
})()
