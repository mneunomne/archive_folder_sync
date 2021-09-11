const { Server, Client } = require('node-osc');
const fs = require('fs');
const mongoose = require("mongoose")
const TextToSVG = require('text-to-svg');
const textToSVG = TextToSVG.loadSync('fonts/arial-unicode-ms.ttf');

require('dotenv').config()

// OSC
const ip_address = process.env.PROCESSING_IP_ADDRESS
const port = process.env.PROCESSING_PORT
const clientProcessing = new Client(ip_address, port);

// text-to-svg
const folder_path = 'texts/'
const attributes = {fill: 'black', stroke: 'black'};
const options = {x: 0, y: 0, fontSize: 32, anchor: 'top', attributes: attributes};

// mongodb
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

var mongoConnected = false
mongoose.connect(mongoUri, { useNewUrlParser: true }, function (err, res) {
  if (err) {
    console.error(err)
    throw err
  }
  mongoConnected = true
  console.log(`[MongoDB] Connected to database "${process.env.MONGODB_DATABASE}"`)

  Audio.find({}, function (err, audios) {
    audios.map((audio) => {
      processText(audio)
    })
  })
})

// socket
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
    // generate svg file from new audio
    processText(audio).then(audio => {
      // send info to processing
      clientProcessing.send('/new_audio', JSON.stringify(audio), () => {
        console.log('sent update')
      });
    });
  })
})

socket.on('update_audio', function (data) {
  Audio.findOne(data, function (err, audio) {
    console.log('[new audio]', audio)
    // generate svg file from new audio
    processText(audio).then(audio => {
      // send info to processing
      clientProcessing.send('/update_audio', JSON.stringify(audio), () => {
        console.log('sent update')
      });
    });
  })
})


// text-to-svg process text
const processText = (audio) => new Promise((resolve, reject) => {
  let text = audio.text
  if (text.length == 0) {
    return;
  }
  const svg = textToSVG.getSVG(text, options);
  let filepath = `${folder_path}${audio.id}.svg`
  // console.log(svg);
  fs.writeFile(filepath, svg, function (err) {
    if (err) {
      reject(err)
      return console.log(err);
    }
    resolve(audio)
    console.log(`${text} > ${filepath}`);
  });
})