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

var jwt = require('jwt-simple');
var secret = 'durand-papp';

module.exports = function(wagner , passport) {
  try {
  var Api = express.Router();

  Api.use(bodyparser.urlencoded({ extended: false }))
  Api.use(bodyparser.json());
  Api.use(busboyBodyParser());   

  Api.get('/search', wagner.invoke(function(User) {
      return function(req, res) {
    // Criamos uma nova promise: prometemos a contagem dessa promise (após aguardar 3s)
      var p1 = new Promise(
      function(resolve, reject) {
      console.log('dentro da promisse');       
            resolve('reject fora da promisse');
            // resolve('fora da promisse');
      });

    // definimos o que fazer quando a promise for realizada
      p1.then(function(val) {
        console.log(val)
      },
      function (val){
        console.log('reject',val);
      });

      var search = {};
          

      var sort = { created_at: -1 };
      var limit = (req.query.limit) ? parseInt(req.query.limit) : 10; 
      var isActive = (req.query.active) ? parseInt(req.query.active) : 1; 
      var skip = (req.query.page) ? ( parseInt(req.query.page) - 1) * limit : 0; 

      var columns = [
       'email' 
      ,'name'
      ,'created_at'
      ];



      if ( req.query.name ) {
        User.find({$text: {$search: req.query.name}}, {score: {$meta: "textScore"}}).sort({score:{$meta:"textScore"}}).
        limit(limit).
        skip(skip).
        where({is_active:isActive}).
        select(columns.join(' ')).
        exec(
          function(err,result){
            handleMany('users',res,err, result)
          }
        );
      }  else {
      User.
        find(search). 
        limit(limit).
        skip(skip).
        where({is_active:isActive}).
        // sort(sort).
        select(columns.join(' ')).
        exec(
          function(err,result){
            handleMany('users',res,err, result)
          }
        );
      }
    };

  }));
 
  Api.get('/count', wagner.invoke(function(User) {
    return function(req, res) {
 
      var isActive = '1';
      if ( req.query.name ) {
        User.find({$text: {$search: req.query.name}}, {score: {$meta: "textScore"}}).sort({score:{$meta:"textScore"}}).
        where({is_active:isActive}).
        count(
          function(err,count){
            handleMany('count',res,err, count)
          }
        );
      }  else {
      User.
        find({}). 
        where({is_active:isActive}).
        count(
          function(err,count){
            handleMany('count',res,err, count)
          }
        );
      }


    };
  }));
 
  Api.put('/update/', wagner.invoke(function(User) {
    return function(req, res) {
      console.log(req.headers)
      if(!req.headers['api-key-papp'])
         throw "USER NOT_FOUND"; 

      var userId = req.headers['api-key-papp'];
      var u = {};
      u.name = req.body.name;
      u.gender = req.body.gender;

      if ( req.body.password ){
         var UserModel = new User(req.body);
        u.password = UserModel.generateHash(req.body.password);
      }

      User.findOneAndUpdate(
        {_id:userId, is_active: '1'}
        , u
        ,function(err) {
          if (err)
              throw err;

          User.findOne({_id:userId},function(err,user){
            res.json({user:user});
          })
          // .populate('concurso2')
          ;
      });
    };
  })); 
 
  Api.delete('/remove/', wagner.invoke(function(User) {
    return function(req, res) {
      if(!req.headers['api-key-papp'])
         throw "USER NOT_FOUND"; 

      var userId = req.headers['api-key-papp'];
      var u = {};
      u.is_active = 0;
      u.updated_at = new Date();

      User.findOneAndUpdate(
        {_id: userId, is_active: 1}
        , u
        ,function(err) {
          if (err)
              throw err;
          res.json({status:'SUCCESS'});
      });
    };
  })); 

  Api.post('/authenticate', wagner.invoke(function( User ) {
    return function(req, res , next) {
      try {
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        var email = req.body.email;
        var testeEmail = re.test(email);

        if ( !testeEmail ){
          handleError(res , 'E-mail is not valid' , next);
        } 
        else {

          var user = new User();

           User.findOne({'email': req.body.email, is_active: '1'}, function(err, existingUser) {
              // if there are any errors, return the error
              if (err){
                handleError(res , err , next );
              } else { 
                // check to see if there's already a user with that email
                if (existingUser && user.validPassword(req.body.password, existingUser.password)) {
                  var token = jwt.encode(existingUser.id, secret);
                  res.json({status:'SUCCESS', authenticationToken: token, user : existingUser });
                } else {
                  handleError(res , 'User or password invalids' , next);
                } 
              }
          });
        }
      } catch ( err ) {
        handleError(res , err , next);
      }
    };
  }));

  Api.post('/save', wagner.invoke(function( User ) {
    return function(req, res , next) {
      try {
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        var email = req.body.email;
        var testeEmail = re.test(email);

        if ( !testeEmail ){
          handleError(res , 'E-mail is not valid' , next);
        } else if ( !req.body.name ) {
          handleError(res , 'Name Not Found' , next);
        }
        else {
           User.findOne({'email': req.body.email, is_active: 1}, function(err, existingUser) {
              // if there are any errors, return the error
              if (err){
                handleError(res , err , next );
              } else { 
                // check to see if there's already a user with that email
                if (existingUser) {
                  handleError(res , 'E-mail já cadastrado.' , next );
                } else {
                  // create the user
                  var newUser = new User(req.body);
                  newUser.password = newUser.generateHash(req.body.password);
                  newUser.save(function(err) {
                      if (err) {
                        handleError(res , err , next);
                      } else {
                        res.json({status:'SUCCESS',tk:newUser.id, user : newUser });
                      }
                  }); 
                } 
              }
          });
        }
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
  console.log(error)
  res.
    status(status.INTERNAL_SERVER_ERROR).
    send({ status:'ERROR', error: error });
    next();

}


