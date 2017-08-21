var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs'); 

// define the schema for our reportType model
var reportTypeSchema = {
  name: {
    type: String
  }
  , is_active: { type: String, default: 1 }
  , created_at: { type: Date, default: Date.now }
  , updated_at: { type: Date, default: Date.now }
};

var schema = new mongoose.Schema(reportTypeSchema);  

// methods ======================
// generating a hash
schema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
schema.methods.validPassword = function(password,reportType_password) {
  return bcrypt.compareSync(password, reportType_password);
};

schema.set('toObject', { virtuals: true });
schema.set('toJSON', { virtuals: true });

// create the model for reportTypes and expose it to our app
module.exports = schema;
module.exports.reportTypeSchema = reportTypeSchema;