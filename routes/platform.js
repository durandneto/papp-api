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

  Api.get('/search', wagner.invoke(function(Platform) {
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
      ,'name'
      ,'created_at'
      ];

      Platform.
        find(search). 
        // populate('user', '-_id email').
        limit(limit).
        skip(skip).
        where({is_active:isActive}). 
        // sort(sort).
        select(columns.join(' ')).
        exec(
          function(err,result){
            handleMany('rows',res,err, result);
          }
        );

    };
  }));
 
  Api.put('/update/', wagner.invoke(function(Platform) {
    return function(req, res) {
      if(!req.headers['api-key-papp'])
         throw "USER NOT_FOUND"; 

      var u = {};
      var platformId = req.body.id;
      u.name = req.body.name;

      Platform.findOneAndUpdate(
        {_id:platformId}
        , u
        ,function(err,p) {
          if (err)
            throw err;

          console.log(p)

          Platform.findOne({_id:platformId},function(err,platform){
            res.json({status:'SUCCESS',row:platform});
          })
          ;
      });
    };
  })); 

  Api.post('/save', wagner.invoke(function( Platform ) {
    return function(req, res , next) {
      try {
        var newPlatform = new Platform(req.body);
          newPlatform.save(function(err) {
            if (err) {
              handleError(res , err , next);
            } else {
              res.json({ platform : newPlatform });
            }
          }); 
      } catch ( err ) {
        handleError(res , err , next);
      }
    };
  }));

  Api.get('/count', wagner.invoke(function(Platform) {
    return function(req, res) {

      var search = {};
      if ( req.query.name ) {
        search.$or = [{
          name: new RegExp( req.query.name , "i" )
        }];
      }      

      Platform.
        find(search). 
        where({is_active:1}).
        count(
          function(err,count){
            handleMany('count',res,err, count)
          }
        );
    };
  }));

  
  Api.delete('/remove/:id', wagner.invoke(function(Platform) {
    return function(req, res) {
      if(!req.headers['api-key-papp'])
         throw "USER NOT_FOUND"; 

      var PlatformId = req.params.id;

      var u = {};
      u.is_active = 0;
      u.updated_at = new Date();

      Platform.findOneAndUpdate(
        {_id: PlatformId, is_active: 1}
        , u
        ,function(err) {
          if (err)
              throw err;
          res.json({status:'SUCCESS'});
      });
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


