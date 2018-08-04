const SERVER_URL = 'https://127.0.0.1:3000';

setInterval(() => {

    setTimeout(() => {
        take_snapshot();
        html2canvas(document.getElementById('source_img')).then(
            async (canvas) => {
                let data = canvas.toDataURL('image/png').replace(/data:image\/png;base64,/, '');

                let options = {
                    "async": true,
                    "crossDomain": true,
                    "url": SERVER_URL + '/getPubKey',
                    "method": "GET",
                    "headers": {
                        "Content-Type": "application/json",
                    },
                    "processData": false,
                }

                try {
                    let response = await $.ajax(options);

                    const key = new NodeRSA.RSA(response, 'pkcs1-public');
                    const encrypted = key.encrypt(data, 'base64');

                    const clientKey = new NodeRSA.RSA({b: 1024});
                    const clientPubKey = clientKey.exportKey('pkcs1-public');
                    const signature = clientKey.sign(data);

                    let settings = {
                        "async": true,
                        "crossDomain": true,
                        "url": SERVER_URL + '/screenshot',
                        "method": "POST",
                        "headers": {
                            "Content-Type": "application/json",
                        },
                        "processData": false,
                        "data": JSON.stringify({
                            data: encrypted,
                            signature: signature,
                            clientPubKey: clientPubKey
                        })
                    }

                    try {
                        let response = await $.ajax(settings);
                        console.log(response);
                    } catch (e) {
                        throw e;
                    }
                } catch (e) {
                    throw e;
                }
            });
    }, 2000);
}, 15000);

Webcam.setSWFLocation("./webcam.swf");
Webcam.set({
    width: 640,
    height: 480,
    dest_width: 640,
    dest_height: 480,
    image_format: 'jpeg',
    jpeg_quality: 90,
    force_flash: false,
    flip_horiz: true,
    fps: 45
});

Webcam.attach('#my_camera');

function take_snapshot() {
    Webcam.snap(function (data_uri) {
        document.getElementById('my_result').innerHTML = '<img id="source_img" src="' + data_uri + '"/>';
    });
}