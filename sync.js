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
				console.log(audio)
				https.get(audio.path, function(response) {
					console.log('downloaded ', audio.path)
					response.pipe(file);
				});
			}
		})
		mongoose.disconnect();
	})
})