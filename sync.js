const https = require('https')
const fs = require('fs');
const mongoose = require("mongoose")

require('dotenv').config()

/* -------------------------------------------------
MongoDB
---------------------------------------------------*/
const mongoUri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOSTNAME}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;
var mongoConnected = false

const Audio = mongoose.model('Audio', mongoose.Schema({
	id: String,
	name: String,
	path: String,
	text: String,
	user_id: String,
	duration: Number,
	lang: Object
}))

mongoose.connect(mongoUri, { useNewUrlParser: true }, function (err, res) {
	if (err) {
		console.error(err)
		throw err
	}
	console.log(`[MongoDB] Connected to database "${process.env.MONGODB_DATABASE}"`)
	Audio.find({}, function (err, audios) {
		audios.map((audio) => {
			let filepath = `audios/${audio.id}.wav`
			if (fs.existsSync(filepath)) {
				// file exists
			} else {
				const file = fs.createWriteStream(`audios/${audio.id}.wav`);
				https.get(audio.path, function(response) {
					console.log('downloaded ', audio.path)
					response.pipe(file);
				});
			}
		})
	})
})
/*
const jsonDataRequest = new Promise((resolve, reject) => {
	const options = {
		hostname: process.env.DB_SERVER_IP,
		port: process.env.DB_SERVER_PORT,
		path: '/api/data',
		method: 'GET',
		json:true
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

jsonDataRequest.then((data) => {
	let json_data = JSON.parse(data.toString())
	// console.log("json_data", json_data.audios)

	json_data.audios.map((audio) => {
		const options = {
			hostname: process.env.DB_SERVER_IP,
			port: process.env.DB_SERVER_PORT,
			path: encodeURI(`/${audio.file}`),
			method: 'GET',
		}

		const req = http.request(options, res => {
			// console.log(`statusCode: ${res.statusCode}`)

			res.on('data', data => {
				const filepath = `audios/${audio.id}.wav`
				fs.writeFile(filepath, data, function (err) {
					if (err) {
						return console.log(err);
					}
					// console.log('wrote file:', filepath)
				})
			})
		})
		req.on('error', error => {
			console.error(error)
		})
		req.end(() => {
						console.log("folder synced")
				})
	})
})
*/