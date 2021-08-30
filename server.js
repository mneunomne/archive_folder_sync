const { Server, Client } = require('node-osc');
const http = require('http')
const https = require('https')
const fs = require('fs');
const mongoose = require ("mongoose")

require('dotenv').config()


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
// var socket = io('https://pandemic-archive-of-voices-db.herokuapp.com');
var socket = io('http://localhost:7777');
socket.connect();

// Add a connect listener
socket.on('connect', function(socket) { 
    console.log('Connected.');
});

// on update event
socket.on('update', function (data) {
	console.log('[socket.io] received update message', data)
	Audio.findOne(data, function (err, audio) {
		console.log('audios', audio)
		if (fs.existsSync(audio.path)) {
			// file exists
		} else {
			const file = fs.createWriteStream(`audios/${audio.id}.wav`);
			https.get(audio.path, function(response) {
				console.log('downloaded ', audio.path)
				response.pipe(file);
			});
		}
	})

	return
	let audio_data = JSON.parse(data)
	console.log('audio_data', audio_data)
	// oscServer.close();
	let new_filepath = `audios/${audio_data.id}.wav`
	downloadAudio(audio_data).then(file_data => {
		fs.writeFile(new_filepath, file_data, function (err) {
			if (err) {
				return console.log(err);
			}
			console.log('wrote file:', new_filepath)
		})
	})
})

// Max client
const downloadAudio = (audio_data) => new Promise((resolve, reject) => {
	const options = {
		hostname: process.env.DB_SERVER_IP,
		port: process.env.DB_SERVER_PORT,
		path: `/${audio_data.filepath}`,
		method: 'GET'
	}
	const req = http.request(options, res => {
		console.log(`statusCode: ${res.statusCode}`)
		res.on('data', d => {
			resolve(d)
		})
	})
	req.on('error', error => {
		console.error('err', error)
		reject(error)
	})
	req.end()
})