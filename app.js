const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));

//import routers from ./routes folder here

//mount the routers here

app.listen(3000);