var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000,
  bodyParser = require('body-parser');

app.use(bodyParser.json({limit: '20mb'}));

var routes = require('./api/routes/pikoRoutes');
routes(app);

var listener = app.listen(port);

console.log(listener);

console.log('API started on port : ' + port);