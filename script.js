const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');

// Get ear images
const leftEarImage = document.getElementById('leftEar');
const rightEarImage = document.getElementById('rightEar');

// Flag to check if images are loaded
let imagesLoaded = false;

// Function to check if both images are loaded
function checkImagesLoaded() {
  if (leftEarImage.complete && rightEarImage.complete) {
    imagesLoaded = true;
  }
}

// Add load event listeners to images
leftEarImage.addEventListener('load', checkImagesLoaded);
rightEarImage.addEventListener('load', checkImagesLoaded);

// Also check immediately in case images are already cached
checkImagesLoaded();

function onResults(results) {
  if (!imagesLoaded) return; // Don't proceed if images aren't loaded

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      // Get more precise face measurements
      const leftEar = landmarks[234];
      const rightEar = landmarks[454];
      const topHead = landmarks[10];
      const leftEye = landmarks[226];
      const rightEye = landmarks[446];

      // Calculate face dimensions
      const faceWidth = Math.abs(rightEar.x - leftEar.x) * canvasElement.width;
      const eyeLevel = (leftEye.y + rightEye.y) / 2;
      const faceHeight = Math.abs(topHead.y - eyeLevel) * canvasElement.height * 2;

      // Calculate ear size (adjust multiplier for desired size)
      const earSize = faceHeight * 0.8;

      // Calculate ear positions
      const leftEarX = leftEar.x * canvasElement.width - earSize * 0.3;
      const rightEarX = rightEar.x * canvasElement.width - earSize * 0.7;
      const earY = topHead.y * canvasElement.height - earSize * 0.1;

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