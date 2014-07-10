# Eu Quero Minha Biblioteca
---

## Sobre este documento

Este documento cobre os principais pre-requisitos e configurações da aplicação _"Eu Quero Minha Biblioteca"_, deve ser o ponto de partida do desenvolvedor para conhecer e entender melhor toda a infraestrutura do projeto.

---

## Sobre a aplicação

Esta aplicação foi desenvolvida em Node.js, utilizando o MongoDB como banco de dados para persistencia, e o Redis como data store(cache e sessão).    


---

## Bootstrap para desenvolvimento

Para iniciar a aplicação em desenvolvimento, os pré-requisitos são:

1 - [Node.js](http://nodejs.org)     
2 - [MongoDB](http://mongodb.org)     
3 - [Redis](http://redis.io)       
4 - [Ruby 2.0.0](http://rvm.io) e gem [foreman](http://blog.daviddollar.org/2011/05/06/introducing-foreman.html) [opcionais]        

Após a instalação das dependencias acima, a instalação do Ruby e da gem `foreman` são opcionais, contudo irão facilitar o processo de inicialização dos processos da aplicação.

---

### Inicialização do servidor

Após a instalação de todas as dependencias listadas acima, o próximo passo é instalar os `packages` que a aplicação depende:

`cd /pasta/do/projeto && bundle install  && npm instal`   

`npm install jake -g && npm install nodemon -g` (se ocorrer algum erro tente instalar com sudo: `sudo npm install jake -g && sudo npm install nodemon -g`)     

Em seguida existem dois metodos para rodar a aplicação em modo de desenvolvimento:

**1 - Com Ruby e foreman instalados:**

`foreman start -f Procfile.dev -p 5000` 

**2 - Sem o ruby e foreman:**

Cada processo deve ser inicializado separado:

`mongod`      
`redis-server`    
`nodemon server.js -p 5000`   

**OBS:** Em produção para iniciar o servidor do node.js, deve-se utilizar o comando `node server.js -p $PORT` ao contrário de `nodemon server.js`, pois o nodemon é **exclusivamente** para desenvolvimento. (veja Procfile.dev e Procfile)


**3 - Importar banco de dados**:

Usamos o [Jakefile](https://github.com/mde/jake) para execução de tasks, sendo assim, para popular o banco de dados, o desenvolvedor deverá executar [na pasta do projeto]:

`jake db:seed -f jakefile.js`  
`jake json:generate -f jakefile.js`    
`jake json:import_libraries -f jakefile.js`  
`jake db:import_sections -f jakefile.js`  
`jake db:import_prefectures -f jakefile.js`  
`jake db:import_schools -f jakefile.js`  
`jake db:normalize_users -f jakefile.js`  
`jake setup:mkdirs -f jakefile.js`  

**OBS:** O servidor do mongodb deve estar rodando para que os dados possam ser salvos com sucesso. Em caso de erro execute `mongod` como um processo separado.

**5 - Instalar o Image Magic para redimensionamento de imagens(criacao de thumbs):**

Ubuntu\Debian: `sudo apt-get install imagemagick`   
CentOS:  `yum install ImageMagick ImageMagick-devel`


**4 - Acessar aplicação:**

`open http://localhost:5000`

---

### Configurações

#### Email 
Essa aplicação utiliza o package [node mailer](https://github.com/andris9/Nodemailer) para disparo de emails. Sendo assim é possivel configurar vários serviços de SMTP para delivery dos emails, como `gmail`, `sendgrid`, `mandrill`, etc. 
Atualmente a aplicação usa o SMTP do `gmail` para autenticação, sendo necessário configurar um nome de usuário e senha válidos para o disparo dos emails:

**1 - Configuração de autenticação de email:**

`app/mailers/auth.js` - Substituir nome de usuário e senha.

---

#### Bancos de dados

Em desenvolvimento, a configuração do MongoDB e do Redis não precisam ser alteradas inicialmente, mas para produção é necessário configurar os dados de acesso ao banco de dados.

**1 - Configuração do mongodb em produção:**

`config/dbConfig.js` - Se o servidor de banco de dados em produção estiver na mesma máquina, a configuração pode ser igual a do ambiente de desenvolviment, algo como:

```js
mongodb: {
    test: {
      url: "mongodb://localhost/euquerominhabiblioteca_test"
    },
    development: {
      url: "mongodb://localhost/euquerominhabiblioteca_development",
    },
    production: {
      url: "mongodb://localhost/euquerominhabiblioteca_production"
    }
  }
```

**2 - Configuração do Redis em produção:**  

`config/dbConfig.js` - O mesmo vale para o redis, em produção a configuração pode ser parecida com a de desenvolvimento: 
```json
    redis: {
    test: {
      url: {
        host: 'localhost',
            port: 6379,
            db: 2,
            prefix: '_session',
            pass: 'test'
          }
      },
    development: {
      url: {
        host: 'localhost',
            port: 6379,
            db: 2,
            prefix: '_session',
          },
    },
    production: {
     host: 'localhost',
            port: 6379,
            db: 2, 
            prefix: '_session',
        }
      }
    }
```

---

#### Monitoramento de perfomance

**New Relic**

A aplicação é monitorada via [New Relic](http://newrelic.com/), para configurar o nome da aplicação e a chave de licença, edite o arquivo `newrelic.js` na pasta raiz do projeto.    
Caso o **New Relic** não seja desejado, para remover o mesmo remova a linha `require('newrelic');` no arquivo `server.js`.

---

## Deploy:

Referências: 
http://savanne.be/articles/deploying-node-js-with-systemd/  
https://www.digitalocean.com/community/articles/how-to-install-and-run-a-node-js-app-on-centos-6-4-64bit        
http://commavee.com/2013/06/01/using-node-js-on-digital-ocean/  
http://stackoverflow.com/a/22018499/1057087     
http://www.technology-ebay.de/the-teams/mobile-de/blog/deploying-node-applications-with-capistrano-github-nginx-and-upstart.html         
https://gun.io/blog/tutorial-deploy-node-js-server-with-example/    

---

### Testing

[TODO]

---

### Authors

- Rafael Fidelis <rafa_fidelis@yahoo.com.br>


---

### TODO

[TODO]

---

### License

2013 - [TODO]
