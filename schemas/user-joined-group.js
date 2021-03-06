// app/models/group.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs'); 
var User = require('./user');
var UserGroup = require('./user-group');

// define the schema for our group model
var groupSchema = {
   users :  [{type : mongoose.Schema.ObjectId, ref : 'User'}]
  , group :  {type : mongoose.Schema.ObjectId, ref : 'UserGroup'}
  , created_at: { type: Date, default: Date.now }
};

var schema = new mongoose.Schema(groupSchema);  

// methods ======================
// generating a hash
schema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
schema.methods.validPassword = function(password,group_password) {
  return bcrypt.compareSync(password, group_password);
};

schema.set('toObject', { virtuals: true });
schema.set('toJSON', { virtuals: true });

// create the model for groups and expose it to our app
module.exports = schema;
module.exports.groupSchema = groupSchema;