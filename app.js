"use strict";

var express = require('express'),
  cookieParser = require('cookie-parser'),
  http = require('http'),
  app = express(),
  env = require('node-env-file'),
  request = require('request-promise');

// Environment variables.
env(__dirname + '/.env');

// Variables.
var port = process.env.PORT || 9001;

// Express set-up.
app.set('port', port);
app.use(cookieParser());
app.use(express.static(__dirname + '/build'));

// Routes.
app.get('/', function(req, res) {
  res.redirect('/github');
});
app.get('/github', function(req, res) {
  res.sendFile('/github/index.html');
});
app.get('/zenhub', function(req, res) {
  res.sendFile('/zenhub/index.html');
});

// This route is hit to initialize Github OAuth.
// We do this server-side to
app.get('/github/login/oauth', function(req, res) {
  res.redirect(process.env.GITHUB_OAUTH_URL + '?client_id=' + process.env.GITHUB_OAUTH_CLIENT_ID +
    '&redirect=' + process.env.GITHUB_OAUTH_REDIRECT_URL + '&scope=repo');
});

// This route is hit after Github OAuth redirect.
app.get('/github/login/oauth/redirect', function(req, res) {
  var code = req.query.code,
    options = {
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      code: code
    },
    config = {
      url: process.env.GITHUB_OAUTH_ACCESS_URL,
      method: 'POST',
      qs: options,
      responseType: 'json',
      resolveWithFullResponse: true,
      json: true
    };

  request(config).then(function(response) {
    var accessToken = response.body.access_token;

    // Set the token in cookies so the client can access it
    res.cookie('accessToken', accessToken, { });

    // Redirect back to the WDC.
    res.redirect('/github/index.html');
  }).catch(function (err) {
    console.log(err);
    res.redirect('/github/index.html');
  });
});

// Start the server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Server listening on port ' + app.get('port'));
});
