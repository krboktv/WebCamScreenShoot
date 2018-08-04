const express = require('express');
const toBuffer = require('typedarray-to-buffer')
const https = require("https");
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const NodeRSA = require('node-rsa');
const app = express();

var options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./certificate.pem'),
};

app.use(cors());
app.use(bodyParser.json({limit: '20mb'}));
app.use(bodyParser.urlencoded({limit: '20mb', extended: true}));

let key = {};

app.post('/screenshot', (req, res) => {
    const host = req.headers.host;
    const dir = './screenshots/'+host.split(':')[0];

    const encrypt_data = req.body.data;
    const clientPubKey = req.body.clientPubKey;
    const clientKey = new NodeRSA(clientPubKey, 'pkcs1-public');
    const signature = toBuffer(req.body.signature);
    const data = key[host].decrypt(encrypt_data, 'utf8');

    if (!clientKey.verify(data, signature)) {
        res.sendStatus(401);
        res.send('Verify is invalid');
        return;
    }

    const buf = Buffer.from(data, 'base64');

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    fs.writeFile(dir+'/'+getFileName()+'.png', buf, (err) => {
        if (err) throw err;
        console.log('save')
        res.sendStatus(201);
        res.send('ok');
    });
});

app.get('/getPubKey', (req, res) => {
    const host = req.headers.host;
    key[host] = new NodeRSA({b: 1024});
    const p = key[host].exportKey('pkcs1-public');
    res.sendStatus(200);
    res.send(p);
});

const server = https.createServer(options, app).listen(3000, function(){
    console.log("Express server listening on port " + 3000);
});

function getFileName() {
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth();
    let hh = today.getHours();
    let min = today.getMinutes();
    let sec = today.getSeconds();
    let yyyy = today.getFullYear();
    if(dd<10)
        dd='0'+dd;
    if(mm<10)
        mm='0'+mm;
    if(hh<10)
        hh='0'+hh;
    if(min<10)
        min='0'+min;
    if(sec<10)
        sec='0'+sec;
    return (dd+'-'+mm+'-'+yyyy+'_'+hh+'-'+min+'-'+sec);
}