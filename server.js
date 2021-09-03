const { Server, Client } = require('node-osc');
const http = require('http')
const https = require('https')
const fs = require('fs');
const mongoose = require("mongoose")
const TextToSVG = require('text-to-svg');

require('dotenv').config()


const clientMax = new Client('10.10.48.111', 7400);

const clientProcessing = new Client("192.168.178.64", 12000);

var oscServer = new Server(7400, '10.10.51.64', () => {
  console.log('OSC Server is listening');
});


/// send test
/*
clientProcessing.send('/new_audio', JSON.stringify({
  "from": "Kazuki",
  "file": "db/audios/5314577364/audio_10@26-12-2020_13-44-04.wav",
  "id": 308,
  "text": "クリスマスは今年もやって来る",
  "from_id": 5314577364,
  "duration_seconds": 5,
  "lang": {
      "name": "japanese",
      "code": "ja",
      "standard": "ISO 639-1"
  }
}), () => {
  console.log('sent clientProcessing')
});
*/

oscServer.on('message', function (msg) {
  console.log(`Message: ${msg}`);
  oscServer.close();
});

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
  var mongoConnected = true
  console.log(`[MongoDB] Connected to database "${process.env.MONGODB_DATABASE}"`)
})

const io = require('socket.io-client');
// Connect to server
var socket = io('https://pandemic-archive-of-voices-db.herokuapp.com');
// var socket = io('http://localhost:7777');
socket.connect();

// Add a connect listener
socket.on('connect', function (socket) {
  console.log('Connected.');
});

// on update event
socket.on('update', function (data) {
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
      // send info to processing
      clientProcessing.send('/new_audio', JSON.stringify(audio), () => {
        console.log('sent update')
      });
    });

    // generate svg file from new audio
    processText(audio);
  })
})

const processText = function (audio) {
  let text = audio.text
  if (text.length == 0) {
    return;
  }
  const svg = textToSVG.getSVG(text, options);
  let filepath = `${folder_path}${audio.id}.svg`
  // console.log(svg);
  fs.writeFile(filepath, svg, function (err) {
    if (err) return console.log(err);
    console.log(`${text} > ${filepath}`);
  });
}
