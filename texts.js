const TextToSVG = require('text-to-svg');
const https = require('https')
const fs = require('fs');
const textToSVG = TextToSVG.loadSync('fonts/arial-unicode-ms.ttf');

const folder_path = 'texts/'
const server_url = 'https://pandemic-archive-of-voices-db.herokuapp.com'


const attributes = {fill: 'black', stroke: 'black'};
const options = {x: 5, y: 0, fontSize: 72, anchor: 'top', attributes: attributes};

https.get(server_url + '/api/data', res => {
  console.log(`statusCode: ${res.statusCode}`)
  if (res.statusCode === 200) {
    var body = ''
    res.on('data', function(chunk){
      body += chunk;
    });

    res.on('end', function(){
        var data = JSON.parse(body);
        //console.log("Got a response: ", data);
        audios.map((audio) => processText(audio))
    });
  }
}).on('error', function(err){
  console.error("error: ", err);
});

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