const { Server, Client } = require('node-osc');
const http = require('http')
const https = require('https')
const fs = require('fs');
const mongoose = require("mongoose")
const TextToSVG = require('text-to-svg');
const textToSVG = TextToSVG.loadSync('fonts/arial-unicode-ms.ttf');

require('dotenv').config()

const ip_address = process.env.MAX_IP_ADDRESS
const port = process.env.MAX_PORT

const clientMax = new Client(ip_address, port);

/* -------------------------------------------------
MongoDB
---------------------------------------------------*/
const mongoUri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOSTNAME}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

const Audio = mongoose.model('Audio', mongoose.Schema({
  id: String,
  name: String,
  path: String,
  text: String,
  user_id: String,
  duration: Number,
  lang: Object
}))

// MongoDb
var mongoConnected = false
mongoose.connect(mongoUri, { useNewUrlParser: true }, function (err, res) {
  if (err) {
    console.error(err)
    throw err
  }
  mongoConnected = true
  console.log(`[MongoDB] Connected to database "${process.env.MONGODB_DATABASE}"`)
})

const io = require('socket.io-client');
// Connect to server
var socket = io('https://pandemic-archive-of-voices-db.herokuapp.com');
// var socket = io('http://localhost:7777');
socket.connect();

// Add a connect listener
socket.on('connect', function (socket) {
  console.log('[Socket.io] Connected.');
});

// on update event
socket.on('new_audio', function (data) {
  console.log('[socket.io] received update message', data)
  Audio.findOne(data, function (err, audio) {
    console.log('[new audio]', audio)
    // save audio file locally, then send update osc message
    const file = fs.createWriteStream(`audios/${audio.id}.wav`);
    https.get(audio.path, function (response) {
      console.log('downloaded ', audio.path)
      response.pipe(file);
      // send info to max
      clientMax.send('/update', `${audio.id}.wav`, () => {
        console.log('sent update')
      });
    });
  })
})
