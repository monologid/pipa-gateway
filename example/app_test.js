var express = require("express");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");

var PipaGateway = require("../");
var app = express();
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var pipaGateway = new PipaGateway(app, {
  configPath: "example/config.json",
  middlewarePath: "middleware"
});

// Open the Pipa Gateway
pipaGateway.open();

module.exports = app;
