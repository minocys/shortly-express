var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link = require('./link')

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  initialize: function(){
    this.on('creating', function(){
      var hash = Promise.promisify(bcrypt.hash);
      return hash(this.get('password'), null, null)
        .bind(this)
        .then(function(hash){
          this.set('password', hash);
        });  
    })
  },
  link: function() {
    return this.belongsToMany(Link);
  },
  comparePass: function(password, callback){
    bcrypt.compare(password, this.get('password'), function(err, result){
      callback(result);
    });
  }
});

module.exports = User;