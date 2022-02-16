import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import morgan from 'morgan';

require('dotenv').config({path:'./.env.dev.local'})

const app = express();

// logger setup
var logger = require('./lib/logger');
var log = logger.init({
    global: true
});

//setup a stream to use with morgan
log.morganStream = {
    write: (message, encoding) => {
        log.debug({'source':'morgan'}, message.replace(/[\n\r]+/g, ''))
    }
};

//allowing requests CORS (Cross origin resource sharing)
app.use(function(req, res, next) {
    app.options('*', cors());
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Referer, Authorization");
    res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
    next();
});

app.use(morgan("dev", {"stream": log.morganStream}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());

// all routes available in the server
var routes = [
    // { name: 'authentication', source: './routes/auth', path: '/api/auth', secured: false, lib: null }
];

//import routers from ./routes folder here
log.info('load our routes');
for(var i=0; i<routes.length; i++){
    log.debug('loading ' + routes[i].name);
    routes[i].lib = require(routes[i].source);

    //run attachLogger if it is defined
    if(typeof(routes[i].lib) == 'function'){
        log.trace('Calling ' + routes[i].source + ' attachLogger()');
        routes[i].lib.attachLogger(log);
    }

    //run init if it is defined
    if(typeof(routes[i].lib.init) == 'function'){
        log.trace('Calling ' + routes[i].source + ' init()');
        routes[i].lib.init();
    }
}
//mount the routers here
log.info('Setting up paths');
for(var i = 0; i < routes.length; i++){
    log.debug('Binding ' + routes[i].path + ' to ' + routes[i].source);
    if(routes[i].secured){
        // setup authorize middleware
        // app.use(routes[i].path, authorize(), routes[i].lib.router);
        app.use(routes[i].path, routes[i].lib.router);  
    }else{
        app.use(routes[i].path, routes[i].lib.router);        
    }
}

//catch 404 errors and forward to error handler
app.use((req, res, next)=>{
    var err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});

// error handlers

// dev error handler
// will print stack trace
if(process.env.NODE_ENV == 'development'){
    app.use((err, req, res, next)=>{
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stracktraces leaked to user
app.use((err, req, res, next)=>{
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: {}
    });
});

// Trace log the loaded paths
for(var i=0; i<routes.length; i++){
    log.trace('Paths under ' + routes[i].path);
    for(var routerKey in routes[i].lib.router.stack){
        log.trace('Path: ' + routes[i].path + routes[i].lib.router.stack[routerKey].route.path)
    }
}

module.exports = app;