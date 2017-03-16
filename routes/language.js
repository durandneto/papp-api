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
      if ( req.query.name ) {
        search.$or = [{
          name: new RegExp( req.query.name , "i" )
        }];
      }      

      var sort = { created_at: -1 };
      var limit = (req.query.limit) ? parseInt(req.query.limit) : 10; 
      var isActive = (req.query.active) ? parseInt(req.query.active) : 1; 
      var skip = (req.query.page) ? ( parseInt(req.query.page) - 1) * limit : 0; 

      var columns = [
      'id'
      ,'email'
      ,'name'
      ,'created_at'
      ];

      Language.
        find(search). 
        limit(limit).
        skip(skip).
        where({is_active:isActive}).
        // sort(sort).
        select(columns.join(' ')).
        exec(
          function(err,result){
            handleMany('rows',res,err, result)
          }
        );
    };
  }));
 
  Api.put('/update/', wagner.invoke(function(Language) {
    return function(req, res) {
      if(!req.headers['api-key-papp'])
         throw "USER NOT_FOUND"; 

      var u = {};
      var languageId = req.body.id;
      u.name = req.body.name;

      Language.findOneAndUpdate(
        {_id:languageId}
        , u
        ,function(err) {
          if (err)
            throw err;

          Language.findOne({_id:languageId},function(err,language){
            res.json({status:'SUCCESS',language:language});
          })
          ;
      });
    };
  })); 


  Api.delete('/remove/:id', wagner.invoke(function(Language) {
    return function(req, res) {
      if(!req.headers['api-key-papp'])
         throw "USER NOT_FOUND"; 

      var languageId = req.params.id;

      var u = {};
      u.is_active = 0;
      u.updated_at = new Date();

      Language.findOneAndUpdate(
        {_id: languageId, is_active: 1}
        , u
        ,function(err) {
          if (err)
              throw err;
          res.json({status:'SUCCESS'});
      });
    };
  })); 

  Api.post('/save', wagner.invoke(function( Language ) {
    return function(req, res , next) {
      try {
        // if(!req.headers['api-key-papp'])
        //  throw "USER NOT_FOUND"; 

        var newLanguage = new Language(req.body);
          newLanguage.save(function(err) {
            if (err) {
              handleError(res , err , next);
            } else {
              res.json({ status:'SUCCESS',row : newLanguage });
            }
          }); 

      } catch ( err ) {
        handleError(res , err , next);
      }
    };
  }));


  Api.get('/count', wagner.invoke(function(Language) {
    return function(req, res) {

      var search = {};
      if ( req.query.name ) {
        search.$or = [{
          name: new RegExp( req.query.name , "i" )
        }];
      }      

      Language.
        find(search). 
        where({is_active:1}).
        count(
          function(err,count){
            handleMany('count',res,err, count)
          }
        );
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


