var express = require('express')
var https = require('https')
var http = require('http')
var app = express()
const fs = require('fs')

const options = {
    key: fs.readFileSync( 'security/server.key' ),
    cert: fs.readFileSync( 'security/server.cert' )
};

app.get('/hello', function (req, res) {
    res.json({"hello": 123});
    res.end()
})

http.createServer(app).listen(80)
https.createServer(options, app).listen(443)