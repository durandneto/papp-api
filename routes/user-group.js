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

  Api.post('/:group/join', wagner.invoke(function(UserGroup, UserJoinedGroup) {
    return function(req, res, next) {

      try {
        if(!req.headers['api-key-papp'])
         throw "USER NOT_FOUND"; 
       var sort = { created_at: -1 };

        UserGroup.
        findOne({_id: req.params.id}). 
        where({is_active:1}).
        exec(
          function(err,result) {
             switch(true){
                case err :
                handleError(res , err , next);
                  break;
                case (result === undefined):
                  handleError(res , 'Group not found' , next);
                  break;
                default:
                  UserJoinedGroup.
                    findOne({group:req.params.group}). 
                    count( function ( err, count ) {
                    if( count > 0 ) {
                      UserJoinedGroup.
                        findOne({group:req.params.group}).
                        exec( function(err, result) {
                           result.users.push(req.body.user.id)
                          UserJoinedGroup.findOneAndUpdate(
                            {_id: result.id}
                            , result
                            ,function(err) {
                              if (err)
                                handleError(res , err , next);
                              else
                              res.json({ status:'SUCCESS'});
                          });

                        }); 

                    } else {
                      var u = req.body;
                      u.users = [req.body.user.id];
                      u.group = req.params.group;

                      var newRow = new UserJoinedGroup(u);
                      newRow.save(function(err) {
                        if (err) {
                          handleError(res , err , next);
                        } else {
                          res.json({ status:'SUCCESS'});
                        }
                      }); 
                    }
                  });
             }
          }
        );
      } catch ( err ) {
        handleError(res , err , next);
      }
    };
  }));
 
  Api.get('/:group/members', wagner.invoke(function(UserJoinedGroup) {
    return function(req, res) {

      var sort = { created_at: -1 };
      var limit = (req.query.limit) ? parseInt(req.query.limit) : 10; 
      var skip = (req.query.page) ? ( parseInt(req.query.page) - 1) * limit : 0; 

      var sort = { created_at: -1 };
      console.log({group:req.params.group});
      UserJoinedGroup.
        findOne(). 
        limit(limit).
        skip(skip).
        populate('users').
        select('users').
        where({group:req.params.group}).
        exec( function (err ,result ) {
          var rows = (result && result.users) ? result.users : []
          res.json({ status:'SUCCESS', rows:rows});
        }
        );
    };
  }));
 
  Api.get('/search', wagner.invoke(function(UserGroup) {
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
        , 'email'
        , 'name'
        , 'created_at'
        , 'user'
        , 'language'
        , 'platform'
      ];

      try {


      UserGroup.
        find(search). 
        populate('user').
        populate('language').
        populate('platform').
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
      } catch (e){
        console.log(e)   
      }
    };
  }));
 
  Api.put('/update/', wagner.invoke(function(UserGroup) {
    return function(req, res) {
      if(!req.headers['api-key-papp'])
         throw "USER NOT_FOUND"; 

      var u = {};
      var groupId = req.body.id;
      u.name = req.body.name;
      u.language = req.body.language;
      u.platform = req.body.platform;
      u.user = req.body.user;

      UserGroup.findOneAndUpdate(
        {_id:groupId}
        , u
        ,function(err) {
          if (err)
            throw err;

          UserGroup.findOne({_id:groupId},function(err,group){
            res.json({ status:'SUCCESS', group:group});
          })
          .populate('user')
          .populate('language')
          .populate('platform')
          ;
      });
    };
  })); 

  Api.post('/save', wagner.invoke(function( UserGroup ) {
    return function(req, res , next) {
      try {
        if(!req.headers['api-key-papp']) 
         throw "USER NOT_FOUND"; 

        switch (true){
          case !req.body.user.id:
            handleError(res , 'User Not Found' , next);
            break;
          case !req.body.platform.id:
            handleError(res , 'Platform Not Found' , next);
            break;
          case !req.body.language.id:
            handleError(res , 'Language Not Found' , next);
            break;
          default:
            var u = req.body;
            u.user = req.body.user.id;
            u.language = req.body.language.id;
            u.platform = req.body.platform.id;
            console.log(u);
            var newUserGroup = new UserGroup(u);
            newUserGroup.save(function(err) {
            if (err) {
              handleError(res , err , next);
            } else {
               UserGroup.
                findOne({_id: newUserGroup.id}). 
                populate('user').
                populate('platform').
                populate('language').
                exec(
                  function(err,result){
                    res.json({ status:'SUCCESS', row : result });
                  }
                );
            }
          }); 
        }
      } catch ( err ) {
        handleError(res , err , next);
      }
    };
  }));

  Api.delete('/remove/:id', wagner.invoke(function(UserGroup) {
    return function(req, res) {
      if(!req.headers['api-key-papp'])
         throw "USER NOT_FOUND"; 

      var userGroupId = req.params.id;

      var u = {};
      u.is_active = 0;
      u.updated_at = new Date();

      UserGroup.findOneAndUpdate(
        {_id: userGroupId, is_active: 1}
        , u
        ,function(err) {
          if (err)
              throw err;
          res.json({status:'SUCCESS'});
      });
    };
  })); 

  Api.get('/count', wagner.invoke(function(UserGroup) {
    return function(req, res) {

      var search = {};
      if ( req.query.name ) {
        search.$or = [{
          name: new RegExp( req.query.name , "i" )
        }];
      }      

      UserGroup.
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
    send({status:'ERROR',  error: error });
    next();
  // res.writeHead(status.INTERNAL_SERVER_ERROR);
  // res.json({ error: error });
  // res.end();
  // console.log({ error: error })

}


