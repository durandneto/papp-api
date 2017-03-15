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



  Api.get('/count', wagner.invoke(function(Topic) {
    return function(req, res) {

      var search = {};
      if ( req.query.name ) {
        search.$or = [{
          name: new RegExp( req.query.name , "i" )
        }];
      }      

      Topic.
        find(search). 
        where({is_active:1}).
        count(
          function(err,count){
            handleMany('count',res,err, count)
          }
        );
    };
  }));
  
  Api.get('/search', wagner.invoke(function(Topic) {
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

      Topic.
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
 
  Api.put('/update/', wagner.invoke(function(Topic) {
    return function(req, res) {
      if(!req.headers['papp-user-key'])
         throw "USER NOT_FOUND"; 

      var u = {};
      var topicId = req.body.topic_id;
      u.name = req.body.name;

      Topic.findOneAndUpdate(
        {_id:topicId}
        , u
        ,function(err) {
          if (err)
            throw err;

          Topic.findOne({_id:topicId},function(err,topic){
            res.json({topic:topic});
          })
          ;
      });
    };
  })); 

  Api.post('/save', wagner.invoke(function( Topic ) {
    return function(req, res , next) {
      try {
        var newTopic = new Topic(req.body);
          newTopic.save(function(err) {
            if (err) {
              handleError(res , err , next);
            } else {
              res.json({ topic : newTopic });
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


