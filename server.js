const { Server, Client } = require('node-osc');
const http = require('http')
const fs = require('fs');

require('dotenv').config()

var oscServer = new Server(process.env.SYNC_OSC_PORT, process.env.SYNC_OSC_IP, () => {
	console.log('OSC Server is listening', process.env.SYNC_OSC_IP, process.env.SYNC_OSC_PORT);
});

// Max client
// var oscClient = new Client(process.env.MAX_OSC_IP, process.env.MAX_OSC_PORT);

oscServer.on('/new_audio', function (msg, req) {
	console.log(`Message: ${msg}`, req);
	let audio_data = JSON.parse(msg[1])
	console.log('audio_data', audio_data)
	// oscServer.close();
	let new_filepath = `audios/${audio_data.id}.wav`
	downloadAudio(audio_data).then(file_data => {
		fs.writeFile(new_filepath, file_data, function (err) {
			if (err) {
				return console.log(err);
			}
			console.log('wrote file:', new_filepath)
			// oscClient.send('/update')
		})
	})
});


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