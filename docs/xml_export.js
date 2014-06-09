// simple test
(function() {
  "use strict";

  /// source: http://stackoverflow.com/a/14496573/1057087
  function heredoc (f) {
      return f.toString().match(/\/\*\s*([\s\S]*?)\s*\*\//m)[1];
  };

  var xmlTemplate = heredoc(function(){/*
  <?xml version="1.0"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:html="http://www.w3.org/TR/REC-html40">
      <Worksheet ss:Name="Sheet1">
        <Table>
          <Row>
            <Cell><Data ss:Type="String">Nome</Data></Cell>
            <Cell><Data ss:Type="String">Email</Data></Cell>
            <Cell><Data ss:Type="String">Data de cadastro</Data></Cell>
          </Row>
          {% for user in users %}
            <Row>
            <Cell><Data ss:Type="String">{{ user.name }}</Data></Cell>
            <Cell><Data ss:Type="String">{{ user.email }}</Data></Cell>
            <Cell><Data ss:Type="String">{{ user.created_at|date('d/m/Y H:i:s') }}</Data></Cell>
            </Row>
          {% endfor %}
        </Table>
      </Worksheet>
    </Workbook>
  */});
  
  
  var users = {
    users: [
      {name: 'Rafael Fidelis', email: 'rafa_(..)@yahoo.com.br', created_at: Date.now()},
      {name: 'Leandro Figueredo', email: 'leandro_(...)@gmail.com', created_at: Date.now()},
      {name: 'Other user ', email: 'other@user.com', created_at: Date.now()}
    ]
  }
  
  var swig  = require('swig')
  , template = swig.compile(xmlTemplate)
  , output = template(users);
  
  console.log(output);

})()