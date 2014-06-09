(function() {
  'use strict';

  var path        = require('path'),
      Prefecture  = require(path.join(__dirname, 'app', 'models', 'mongoose' , 'prefecture')),
      AdminUser   = require(path.join(__dirname, 'app', 'models', 'mongoose' , 'admin_user')),
      Library     = require(path.join(__dirname, 'app', 'models', 'mongoose' , 'library')),
      School      = require(path.join(__dirname, 'app', 'models', 'mongoose' , 'school')),
      Section     = require(path.join(__dirname, 'app', 'models', 'mongoose' , 'section')),
      config      = require(path.join(__dirname , 'config')),
      mongoose    = require('mongoose'),
      glob        = require('glob'),
      fs          = require('fs'),
      _s          = require('underscore.string');

  var helper        = require(path.join(__dirname,"app","helpers","states")),
      state_regions = helper.regions,
      states        = helper.states,
      readDir       = require('readdir')

  var loadJSON = function(json_filename) {
    var file_data = fs.readFileSync(path.join(__dirname , 'db', 'seeds', json_filename + '.json') , 'utf8');
    return JSON.parse(file_data)
  }

  var getRegion = function(state)  {
    var region = ""
    state_regions.forEach(function(item,index) {
      if(item.states.indexOf(state) != -1) {
        return region = item.region_name;
      }
    })
    return region;
  } 

  namespace("setup", function() {
    desc("create necessary dir");
    task("mkdirs", function() {
      var mkdirp = require('mkdirp');

      var dirs = ["/public/html/uploads/site","/public/html/uploads/admin"];

      dirs.forEach(function(dir,index) {
        var fullpath = path.join(__dirname, dir);
        if(mkdirp.sync(fullpath)) {
          console.log("Creating directory %s", fullpath);
        }
      })
    })
  });

  namespace('db', function() {
    config.setupDatabase(mongoose);

    desc("Import prefectures")
    task("import_prefectures", {async: true}, function() {

      console.time('Import prefectures JSON');

      var files = readDir.readSync(path.join(__dirname, "db","seeds","prefeituras"), ["**/*.json"]).map(function(item, index)  {
        return "prefeituras/" + item.replace(/\.json$/, "")
      });

      var mountStructuredJSON = function(prefecture) {
        var structuredJSON =  {
          site: _s.clean(prefecture.site),
          address: {
            city:  {
              name: _s.titleize(prefecture.city)
            },
            state: {
              name: states[prefecture.state.toUpperCase()],
              uf: prefecture.state,
              region: getRegion(prefecture.state.toUpperCase())
            },
            coordinates: {
              lat: "",
              lng: ""
            },
            country: {
              name: "Brasil"
            },
            district: {
              name: _s.titleize(prefecture.district)
            },
            number: prefecture.number,
            street: _s.titleize(prefecture.street),
            zipcode: prefecture.zipcode,
            full_address: prefecture.district ? [prefecture.street, prefecture.district, prefecture.city].join(" - ") : prefecture.street
          },
          emails: prefecture.emails,
          mayor: {
            name: prefecture.mayor_name
          },
          telephones: prefecture.telephones
        }

        return structuredJSON;
      }

      var total_prefectures = 0,
          total_added       = 0

      var checkCompleted = function() {
        if(++total_added >= total_prefectures) {
          console.timeEnd('Import prefectures JSON');
          complete();
        }
      }

      Prefecture.remove({}, function() {
        files.forEach(function(file, index) {
          var prefectures = loadJSON(file);
          total_prefectures += prefectures.length

          prefectures.forEach(function(prefecture, index) {
            prefecture = new Prefecture(mountStructuredJSON(prefecture))
            prefecture.save(function(err) {
              console.log("%s/%s", total_added, total_prefectures);
              checkCompleted();
            })
          })
        })
      })
    })

    desc("Import schools")
    task("import_schools", {async: true}, function() {

      var mountStructuredJSON = function(school) {
        var filterYes = function(objekt, expected_value) {
          expected_value = expected_value || "sim"
          return Object.keys(objekt).filter(function(key) { return objekt[key].toLowerCase() == expected_value })
        }

        var address = school.address

        var education = filterYes(school.education)
        var others    = filterYes(school.others)

        var structuredJSON =  { 
          name: _s.clean(_s.titleize(school.name)),
          email: _s.clean(school.email),
          kind: _s.clean(school.kind),
          address: {
            complement: address.complement,
            number: address.number,
            street: _s.clean(address.street),
            zipcode: address.zipcode,
            city:  {
              name: _s.titleize(_s.clean(address.city))
            },
            state: {
              name: states[address.state.toUpperCase()],
              uf: address.state.toUpperCase(),
              region: getRegion(address.state.toUpperCase())
            },
            district: {
              name: _s.titleize(_s.clean(school.address.district))
            },
            full_address: _s.clean(_s.titleize([address.street, ", ", address.number, ", " , address.complement, " - ", address.district, " ", address.zipcode, " - ", address.city, ", ", address.state].join("")))
          },
          telephone: school.telephone,
          fax: school.fax,
          education: education,
          others: others
        }

        return structuredJSON;
      }

      console.time('Import schools JSON');

      var files = readDir.readSync(path.join(__dirname, "db","seeds","schools"), ["*.json"]).map(function(item, index)  {
        return "schools/" + item.replace(/\.json$/, "")
      });

      var checkCompleted = function() {
        if(++total_added >= total_schools) {
          console.timeEnd('Import schools JSON');
          complete();
        }
      }

      var total_schools = 0,
          total_added   = 0;

      console.log('Hold on, we gonna import schools for our database, this can take any minutes.')

      files.forEach(function(file, index) {
        var schools = loadJSON(file);
        total_schools += schools.length

        console.log("More %s schools to be imported", schools.length)

        schools.forEach(function(school, index) {
          school = new School(mountStructuredJSON(school))
          
          school.save(function(err) {
            console.log("%s/%s", total_added, total_schools);
            checkCompleted();
          })
        })

      });

    })

    desc("Import default sections")
    task("import_sections", {async: true}, function() {
      var sections = loadJSON("sections"),
          keys     = Object.keys(sections);

      keys.forEach(function(key,index) {
        var section = new Section(sections[key]);

        section.save(function(err) {
          if(err) {
            console.log("Error creating section: %s", section.key );
            console.log("[ERROR]", err)
          } else {
            console.log("Section %s successfully created", section.key);
          }
          // call complete listener when all users has sucessfully added
          if((index + 1) == keys.length) {
            complete();
          }
        })
      })
    });


    desc('Seed admin database')
    task('seed', {async: true}, function() {


      var users = [
        {
          name: 'Rafael Fidelis',
          email: 'admin@ecofuturo.org.br',
          password: 'm4k3u557r0n63r'
        }
      ]
      users.forEach(function(data,index) {

        var newUser = new AdminUser(data);

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
        var city_id   = parseInt(library.idcidade),
          city_data   = jsonData.cities[(city_id - 1)]

        if(city_id && city_data.estado) {
          var city_name   = city_data.nome,
            state_id      = parseInt(city_data.estado),
            state_data    = jsonData.states[(state_id - 1)],
            address       = [city_name, state_data.nome].join(' - ');

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
            email: library.email.toUpperCase(),
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
          var newLibrary  = new Library(library_data)

          if(library_data == undefined) {
            return callback.call(null,newLibrary)
          }

          newLibrary.postCreate(library_data, function(data) {
            callback.call(null, newLibrary)
          })
        }

        var totalLibraries    = process.env.MAX || librariesData.length,
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
