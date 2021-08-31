const { Server, Client } = require('node-osc');


require('dotenv').config()


const client = new Client('10.10.48.88', 7400);


setInterval(() => {
  client.send('/play', ['rTAk9R9E', parseInt(Math.random() * 7)], () => {
    console.log('sent play')
  });
}, 2000)