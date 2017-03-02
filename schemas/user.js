// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs'); 

// define the schema for our user model
var userSchema = {
    photo: { 
    type: String
  }
  , locale: {
    type: String 
  }
  , password: {
    type: String 
  }
  , gender: {
    type: String
  } 
  , name: {
    type: String
  } 
  , facebook_id: {
    type: String
  }  
  , googleplus_id: {
    type: String
  }  
  , email: {
    type: String
  }  
  , created_at: { type: Date, default: Date.now }
  , updated_at: { type: Date, default: Date.now }
};

var schema = new mongoose.Schema(userSchema);  

// methods ======================
// generating a hash
schema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
schema.methods.validPassword = function(password,user_password) {
  return bcrypt.compareSync(password, user_password);
};

schema.set('toObject', { virtuals: true });
schema.set('toJSON', { virtuals: true });

// create the model for users and expose it to our app
module.exports = schema;
module.exports.userSchema = userSchema;