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

  Api.get('/search', wagner.invoke(function(User) {
    return function(req, res) {
  // Criamos uma nova promise: prometemos a contagem dessa promise (após aguardar 3s)
  var p1 = new Promise(
    function(resolve, reject) {
    console.log('dentro da promisse');       
          resolve('fora da promisse');
    });

  // definimos o que fazer quando a promise for realizada
  p1.then(
    function(val) {
    console.log(val)

      });
      var search = {};
      if ( req.body.name ) {
        search.$or = [{
          name: new RegExp( req.body.name , "i" )
        }];
      }      

      var sort = { created_at: -1 };
      // User.
      //   find({
      //     $text: {
      //       $search: "text you are searching for"
      //     }
      //   },
      //   {
      //     score: {
      //       $meta: "textScore"
      //     }
      //   }). 
      //   limit(1).
      //   sort(sort).
      //   exec(handleMany.bind(null, 'users', res));
      User.
        find(search). 
        limit(1).
        sort(sort).
        exec(handleMany.bind(null, 'users', res));
    };
  }));
 
  Api.put('/update/', wagner.invoke(function(User) {
    return function(req, res) {
      if(!req.headers['papp-user-key'])
         throw "USER NOT_FOUND"; 

      var userId = req.headers['papp-user-key'];
      var u = {};
      u.name = req.body.name;
      u.gender = req.body.gender;

      User.findOneAndUpdate(
        {_id:userId}
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

  Api.post('/save', wagner.invoke(function( User ) {
    return function(req, res , next) {
      try {
           User.findOne({'email': req.body.email}, function(err, existingUser) {
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
                        res.json({tk:newUser.id, user : newUser });
                      }
                  }); 
                } 
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

}


