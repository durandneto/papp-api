var mongoose = require('mongoose');
var _ = require('underscore');

module.exports = function(wagner) {
  var mongoURI = "mongodb://127.0.0.1:27017/papp";
  var MongoDB = mongoose.connect(mongoURI).connection;
  MongoDB.on('error', function(err) { console.log(err.message); });
  MongoDB.once('open', function() {
    console.log("mongodb connection open");
  });

  wagner.factory('db', function() {
    return mongoose;
  });

  var User = mongoose.model('User', require('./schemas/user'), 'users');
  var UserGroup = mongoose.model('UserGroup', require('./schemas/user-group'), 'userGroups');
  var UserJoinedGroup = mongoose.model('UserJoinedGroup', require('./schemas/user-joined-group'), 'userJoinedGroups');
  var Topic = mongoose.model('Topic', require('./schemas/topic'), 'topics');
  var ReportType = mongoose.model('ReportType', require('./schemas/report-type'), 'reportTypes');
  var Report = mongoose.model('Report', require('./schemas/report'), 'reports');
  var Platform = mongoose.model('Platform', require('./schemas/platform'), 'platforms');
  var Language = mongoose.model('Language', require('./schemas/language'), 'languages');
   
  var models = {
    Platform: Platform,
    Language: Language,
    UserGroup: UserGroup,
    UserJoinedGroup: UserJoinedGroup,
    Report: Report,
    ReportType: ReportType,
    Topic: Topic,
    User: User
  };

  // Registra todos os models do mongodb para utilizar na api
  _.each(models, function(value, key) {
    wagner.factory(key, function() {
      return value;
    });
  });
 
  return models;
};
