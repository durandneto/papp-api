// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;

// load the auth variables
var configAuth = require('./auth'); // use this one for testing

module.exports = function(passport , wagner ) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.email);
    });

    // used to deserialize the user
    passport.deserializeUser(function(email, done) {
        wagner.invoke(function( User ) {
            User.findOne({ 'email' : email }, function(err, user) {
                done(err, user);
            });
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {

        // asynchronous
        process.nextTick(function() {
            wagner.invoke(function( User ) {
                var u = new User();
                User.findOne({ 'email' :  email }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);
                    // if no user is found, return the message
                    if (!user)
                        return done(null, false, req.flash('loginMessage', 'Usurário não encontrado.'));

                     if (!u.validPassword(password,user.password))
                    return done(null, false, req.flash('loginMessage', 'Oops! usuário ou senha inválidos.'));

                    else
                        return done(null, user);
                });
            })
        });

    })); 
    //========================================================================
    // LOCAL cadastro =============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {

        // asynchronous
        process.nextTick(function() {
            wagner.invoke(function(User) {

                    try {
                         User.findOne({'email': email}, function(err, existingUser) {

                            // if there are any errors, return the error
                            if (err)
                                return done(err);
                            // check to see if there's already a user with that email
                            if (existingUser) 
                                return done(null, false, req.flash('loginMessage', 'E-mail já cadastrado.'));
             
                            // create the user
                            var newUser            = new User(req.body);
                            newUser.password = newUser.generateHash(req.body.password);

                            newUser.save(function(err) {
                                if (err)
                                    return done(err);
                                return done(null, newUser);
                            }); 
                        });
                    } catch ( err ) {
                        return done(err);
                    }
            }) ;
        });

    }));
};