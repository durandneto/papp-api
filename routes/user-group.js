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

  Api.post('/join', wagner.invoke(function(UserJoinedGroup) {
    return function(req, res) {

      try {
        if(!req.headers['papp-user-key'])
         throw "USER NOT_FOUND"; 

       var u = req.body;
       u.user = req.headers['papp-user-key'];
       u.group = req.body.group;

        var newRow = new UserJoinedGroup(u);
          newRow.save(function(err) {
            if (err) {
              handleError(res , err , next);
            } else {
              res.json({ joinedUserGroup : newRow });
            }
          }); 
      } catch ( err ) {
        handleError(res , err , next);
      }
    };
  }));
 
  Api.get('/members/:group', wagner.invoke(function(UserJoinedGroup) {
    return function(req, res) {

      var sort = { created_at: -1 };
      UserJoinedGroup.
        find({group:req.params.group}). 
        // limit(1).
        // sort(sort).
        populate('user').
        populate('group').
        exec(handleMany.bind(null, 'members', res));
    };
  }));
 
  Api.get('/search', wagner.invoke(function(UserGroup) {
    return function(req, res) {

      var search = {};  

      var sort = { created_at: -1 };
      UserGroup.
        find(search). 
        // limit(1).
        sort(sort).
        populate('user').
        populate('platform').
        populate('language').
        exec(handleMany.bind(null, 'groups', res));
    };
  }));
 
  Api.put('/update/', wagner.invoke(function(UserGroup) {
    return function(req, res) {
      if(!req.headers['papp-user-key'])
         throw "USER NOT_FOUND"; 

      var u = {};
      var groupId = req.body.group;
      u.name = req.body.name;
      u.language = req.body.language;
      u.platform = req.body.platform;

      UserGroup.findOneAndUpdate(
        {_id:groupId}
        , u
        ,function(err) {
          if (err)
            throw err;

          UserGroup.findOne({_id:groupId},function(err,group){
            res.json({group:group});
          }).populate('user')
          ;
      });
    };
  })); 

  Api.post('/create', wagner.invoke(function( UserGroup ) {
    return function(req, res , next) {
      try {
        if(!req.headers['papp-user-key'])
         throw "USER NOT_FOUND"; 

       var u = req.body;
       u.user = req.headers['papp-user-key'];

        var newUserGroup = new UserGroup(u);
          newUserGroup.save(function(err) {
            if (err) {
              handleError(res , err , next);
            } else {
              res.json({ group : newUserGroup });
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


