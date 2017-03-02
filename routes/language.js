var bodyparser = require('body-parser');
var express = require('express');
var status = require('http-status');
var _ = require('underscore');
var mongoose = require('mongoose'); 
var fileUpload = require('express-fileupload');
var busboyBodyParser = require('busboy-body-parser');
var slugify = require('slugify');
var mime = require('mime');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

module.exports = function(wagner , passport) {
  try {
  var Api = express.Router();

  Api.use(bodyparser.urlencoded({ extended: false }))
  Api.use(bodyparser.json());
  Api.use(busboyBodyParser());   

  Api.get('/search', wagner.invoke(function(Language) {
    return function(req, res) {

      var search = {};

      var sort = { created_at: -1 };
      Language.
        find(search). 
        // limit(1).
        sort(sort).
        //populate('user').
        exec(handleMany.bind(null, 'languages', res));
    };
  }));
 
  Api.put('/update/', wagner.invoke(function(Language) {
    return function(req, res) {
      if(!req.headers['papp-user-key'])
         throw "USER NOT_FOUND"; 

      var u = {};
      var languageId = req.body.language_id;
      u.name = req.body.name;

      Language.findOneAndUpdate(
        {_id:languageId}
        , u
        ,function(err) {
          if (err)
            throw err;

          Language.findOne({_id:languageId},function(err,language){
            res.json({language:language});
          })
          ;
      });
    };
  })); 

  Api.post('/save', wagner.invoke(function( Language ) {
    return function(req, res , next) {
      try {
        if(!req.headers['papp-user-key'])
         throw "USER NOT_FOUND"; 
        var newLanguage = new Language(req.body);
          newLanguage.save(function(err) {
            if (err) {
              handleError(res , err , next);
            } else {
              res.json({ language : newLanguage });
            }
          }); 
      } catch ( err ) {
        handleError(res , err , next);
      }
    };
  }));
 
  return Api;

  } catch ( err ) {
  console.log( 'geral' , err);
}


};


  /**
  * @description: Funcao generica para para padronizar o retorno singular da Api
  * @developer : Durand Neto
  */
function handleOne(property, res, error, result) {
  if (error) {
    return res.
      status(status.INTERNAL_SERVER_ERROR).
      json({ error: error.toString() });
  }
  if (!result) {
    return res.
      status(status.NOT_FOUND).
       json({ error: 'Not found' });
  }

  var json = {};
  json[property] = result;
  res.json(json);
}

  /**
  * @description: Funcao generica para para padronizar o retorno array da Api
  * @developer : Durand Neto
  */
function handleMany(property, res, error, result) {
  if (error) {
    return res.
      status(status.INTERNAL_SERVER_ERROR).
      json({ error: error.toString() });
  }

  var json = {};
  json[property] = result;
  res.json(json);
}

function handleError( res, error , next ) {
  res.
    status(status.INTERNAL_SERVER_ERROR).
    send({ error: error });
    next();
  // res.writeHead(status.INTERNAL_SERVER_ERROR);
  // res.json({ error: error });
  // res.end();
  // console.log({ error: error })

}


