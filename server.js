const { Server } = require('node-osc');
const http = require('http')
const fs = require('fs');

require('dotenv').config()

var oscServer = new Server(process.env.OSC_PORT, process.env.OSC_IP, () => {
	console.log('OSC Server is listening');
});

oscServer.on('message', function (msg) {
	console.log(`Message: ${msg}`);
	oscServer.close();
});

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
	console.log("json_data", json_data.audios)

	json_data.audios.map((audio) => {
		const options = {
			hostname: process.env.DB_SERVER_IP,
			port: process.env.DB_SERVER_PORT,
			path: encodeURI(`/${audio.file}`),
			method: 'GET',
		}

		const req = http.request(options, res => {
			console.log(`statusCode: ${res.statusCode}`)
			
			res.on('data', data => {
				const filepath = `audios/${audio.id}.wav`
				fs.writeFile(filepath, data, function (err) {
					if (err) {
						return console.log(err);
					}
					console.log('wrote file:', filepath)
				})
			})
		})
		req.on('error', error => {
			console.error(error)
		})
		req.end()
	})
})

/*
let json_data = fs.readFileSync('public/db_test/data.json')
let db_data = JSON.parse(json_data)
let audios = db_data.audios

audios.map(audio => {
	console.log("audio", audio)
	fs.copyFile(`public/${audio.file}`, `public/db/max_audios/${audio.id}.wav`, (err) => {
		if (err) {
			console.error("err", err)
		};
		console.log('source.txt was copied to destination.txt');
	});
})
*/
