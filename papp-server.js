var express = require('express');
var wagner = require('wagner-core');
require('./models')(wagner);
require('./config/dependencies')(wagner);
var app = express();
var passport = require('passport');
var session      = require('express-session');
var flash    = require('connect-flash');
var cookieParser = require('cookie-parser');

var cors = require('cors');

var busboy = require('connect-busboy');
require('./config/passport')( passport , wagner ); 


  /**
  * @description: habilitando o CORS para a api funcionar em servidores diferentes
  * @developer : Durand Neto
  */ 

var whitelist = [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000',
    'http://admin.papp.im',
    'admin.papp.im'
];
var corsOptions = {
    origin: function(origin, callback){
        var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
        callback(null, originIsWhitelisted);
    },
    credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // include before other routes

app.use(cookieParser()); // read cookies (needed for auth)
// required for passport
app.use(session({ secret: 'durandneto' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

app.use(flash()); // use connect-flash for flash messages stored in session
app.use(express.static('files'));

app.use('/api/v1/user', require('./routes/user')(wagner , passport));
app.use('/api/v1/user/group', require('./routes/user-group')(wagner , passport));
app.use('/api/v1/topic', require('./routes/topic')(wagner , passport));
app.use('/api/v1/report/type', require('./routes/report-type')(wagner , passport));
app.use('/api/v1/report', require('./routes/report')(wagner , passport));
app.use('/api/v1/platform', require('./routes/platform')(wagner , passport));
app.use('/api/v1/language', require('./routes/language')(wagner , passport));

app.listen(3010);
console.log('Listening on port 3010!');