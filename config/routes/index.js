var self   = {}, 
    routes = {}; 

routes.library = require('./api/libraries');
routes.contact = require('./api/contacts');
routes.webapp  = require('./webapp');
routes.admin   = require('./admin');

self.setup = function(app) {

  app.get('/', routes.webapp.index)

  app.post("/contact/?",routes.webapp.contact.create)
  app.post("/library/?", routes.webapp.library.create)

  app.namespace('/api', function() {    
    app.namespace('/libraries', function() {
      app.get('/'     , routes.library.all)
      app.get('/search/?',  routes.library.search)
    });
    app.namespace('/library', function() {
      app.get("/:id/?", routes.library.read)
    })
  })


  app.namespace('/admin', function() {
    
    var admin = routes.admin
    
    app.get('/', admin.index)
    app.get('/dashboard/?', admin.index)
    
    app.get('/login/?', admin.sessions.new)
    app.get('/logout/?', admin.sessions.logout)
    app.post('/login/?', admin.sessions.login)

    app.namespace('/libraries',function() {
      app.get('/', admin.libraries.index)
      app.get('/category/:category_id/?', admin.libraries.index)
      app.get('/page/:page/?' , admin.libraries.index)
      app.get("/export.xls" , admin.libraries.export_data)
    })

    app.namespace('contacts', function() {
      app.get('/', admin.contacts.index)
      app.get('/page/:page/?' , admin.contacts.index)
      app.get("/export.xls" , admin.contacts.export_data)
    })
    app.namespace('contact', function() {
      app.get('/:id/?', admin.contacts.show)
      app.del('/:id/?', admin.contacts.delete)
    })

    app.namespace('/users', function() {
      app.get('/new/?', admin.users.new)
      app.post('/', admin.users.create)
      app.get('/', admin.users.index)
    })

    app.namespace('user', function() {
      app.get('/edit/:id/?', admin.users.edit)
      app.put('/:id/?', admin.users.update)
      app.delete('/:id/?', admin.users.delete)
    })

    app.namespace('manage', function() {
      app.get("/:section/?", admin.manage.manage_section);
      app.put("/:section/?", admin.manage.update_section);
    })

    app.namespace('/library', function() {
      app.get('/edit/:id/?', admin.libraries.edit)
      app.put('/:id/?', admin.libraries.update)
      app.get('/:id/?', admin.libraries.show)
      app.get('/new/?', admin.libraries.new)
      app.del('/:id/?', admin.libraries.delete)
    })

    app.namespace('/libraries', function() {
      app.post('/', admin.libraries.create)
    });
  });
}

module.exports = self;