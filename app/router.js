var Router = require('express').Router();
var util = require('../lib/utility');
var db = require('./config');
var Users = require('./collections/users');
var User = require('./models/user');
var Links = require('./collections/links');
var Link = require('./models/link');
var Click = require('./models/click');

Router.get('', util.checkUser, function(req, res, next) {
  res.render('index');
});

Router.get('/create', util.checkUser,
function(req, res) {
  res.render('index');
});

Router.route('/links')
.get(function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
})
.post(function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

Router.route('/login')
.get(function(req, res, next){
  res.render('login');
})
.post(function(req, res, next){
  new User({username:req.body.username}).fetch().then(function(user){
    user.comparePass(req.body.password, function(result){
      if(result){
        console.log('Passwords Match!');
        util.newSession(req, res);
      } else {
        res.redirect('/login');
      }
    }); 
  })
});

Router.route('/signup')
.get(function(req, res, next){
  res.render('signup');
})
.post(function(req,res, next){
  var username = req.body.username;
  var password = req.body.password;
  new User({username: username}).fetch().then(function(user){
    if(!user){
      var newUser = new User({
        'username':username,
        'password':password
      }).save().then(function(newUser) {
        Users.add(newUser);
        util.newSession(req, res);
      });
    } else {
      console.log('That account name has been taken.');
      res.redirect('/signup');
    }
  })
});

Router.route('/logout')
.all(function(req, res, next){
  req.session.destroy(function(){
    res.redirect('/login');
  });
})

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

Router.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

module.exports = Router;