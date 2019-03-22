/**
 * app.js
 */
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({secret: 'chatbot', resave: false, saveUninitialized: false }));
app.use(express.static(__dirname + '/public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// router
var bot = require('./routes/bot');
var web = require('./routes/web');
app.use('/', bot);
web(app);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use((err, req, res, next) => {
    if (err && err.status != 404) {
        console.log('ERROR\n', err);
    }

    // render the error page
    res.status(err.status || 500);
    res.end(err.message);
});

// catch exceptions
process.on('uncaughtException', function(err) {
    console.error('EXCEPTION\n', err);
});

module.exports = app;
