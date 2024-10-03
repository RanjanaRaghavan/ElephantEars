const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    
    if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
            // Get more precise ear positions
            const leftTemple = landmarks[234];
            const rightTemple = landmarks[454];
            const topOfHead = landmarks[10];
            const bottomOfFace = landmarks[152];

            // Calculate face width and height
            const faceWidth = Math.abs(rightTemple.x - leftTemple.x) * canvasElement.width;
            const faceHeight = Math.abs(topOfHead.y - bottomOfFace.y) * canvasElement.height;

            // Calculate ear sizes (adjust multiplier for desired size)
            const earSize = faceWidth * 0.7;  // Adjust this multiplier as needed

            // Calculate ear positions
            const leftEarX = leftTemple.x * canvasElement.width - earSize * 0.6;  // Move slightly outward
            const rightEarX = rightTemple.x * canvasElement.width - earSize * 0.4;  // Move slightly outward
            const earY = (topOfHead.y * canvasElement.height) - earSize * 0.3;  // Move slightly upward

            // Set composition mode to respect transparency
            canvasCtx.globalCompositeOperation = 'source-over';

            // Draw ears
            canvasCtx.drawImage(leftEarImage, leftEarX, earY, earSize, earSize);
            canvasCtx.drawImage(rightEarImage, rightEarX, earY, earSize, earSize);
        }
    }
    canvasCtx.restore();
}

const faceMesh = new FaceMesh({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
}});
faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({image: videoElement});
    },
    width: 1280,
    height: 720
});
camera.start();

const elephantEars = new Image();
elephantEars.src = 'image2.png';

faceMesh.onResults((results) => {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        const leftEar = landmarks[234]; // Example landmark for left ear position
        const rightEar = landmarks[454]; // Example landmark for right ear position

        canvasCtx.drawImage(elephantEars, leftEar.x * canvasElement.width - 100, leftEar.y * canvasElement.height - 100, 200, 200);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

