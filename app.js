var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var debate = require('./routes/debate');
var _debate = require('./routes/_debate');
var debateCN = require("./routes/debate_cn.js")
var release = require("./routes/release.js")

var ECT = require('ect'); // ECT 読み込み

var app = express();

// view engine setup

//app.engine('ect', ECT({ watch: true, root: __dirname + '/views', ext: '.ect' }).render);
//app.set('view engine', 'ect');


var ejs = require('ejs');
app.engine('.html', ejs.__express);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var cookieParser = cookieParser('secret');
var sessionStore = new session.MemoryStore();
app.use(cookieParser);
app.use(express.static(path.join(__dirname, '/public')));




//app.use(session({
//    secret: 'keyboard cat',
//    resave: false,
//    saveUninitialized: false,
//    cookie: {
//        maxAge: 30 * 60 * 1000
//    }
//}));

app.use(session({ secret: 'secret', store: sessionStore }));

app.cookieParser = cookieParser;
app.sessionStore = sessionStore;


app.use('/debate',debate);
app.use('/_debate',_debate);
app.use("/debateCN",debateCN)
app.use("/release",release)


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
