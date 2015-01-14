var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var router = require('./app/router.js');

var app = express();

//sessions
app.use(session({
  secret: 'secrets',
  resave: false,
  saveUninitialized: false
}));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
//Serve client files
app.use(express.static(__dirname + '/public'));
app.use('/', router);

console.log('Shortly is listening on 4568');
app.listen(4568);
