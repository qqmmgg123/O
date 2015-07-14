var path = require('path')
  ,	express = require('express.io')
  , app = express().http().io()
  , log = require('util').log;

app.set('view engine', 'html');
app.engine('.html', require('ejs').__express);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.bodyParser());

app.use(app.router);

//routes
require('./routes')(app);

//all environments
//app.set('port', process.env.PORT || 7002);
app.listen(3000);

log('express.io server running on ' + 3000);
