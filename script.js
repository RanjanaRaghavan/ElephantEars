const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');

// Get ear images
const leftEarImage = document.getElementById('leftEar');
const rightEarImage = document.getElementById('rightEar');

// Flag to check if images are loaded
let imagesLoaded = false;
let flapAngle = 0;
const flapSpeed = 0.1; // Adjust for faster or slower flapping

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

const elephantSound = new Audio('./images/elephant_sounds.mp3');
const mouthOpenThreshold = 0.1; // Adjust this value as needed
let canPlaySound = true;

// document.addEventListener('click', () => {
//   canPlaySound = true;
//   // Try to play the sound once to "unlock" audio
//   elephantSound.play().then(() => {
//     elephantSound.pause();
//     elephantSound.currentTime = 0;
//   }).catch(error => console.log('Error unlocking audio:', error));
// });

function onResults(results) {
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];
    
    // MediaPipe Face Mesh indices for upper and lower lip
    const upperLipIndex = 13;
    const lowerLipIndex = 14;
    
    const upperLipY = landmarks[upperLipIndex].y;
    const lowerLipY = landmarks[lowerLipIndex].y;
    
    const mouthOpenness = lowerLipY - upperLipY;
    
    console.log('Mouth openness:', mouthOpenness); // For debugging
    console.log('canPlaySound:' , canPlaySound); // For debugging

    if (mouthOpenness > mouthOpenThreshold && canPlaySound) {
      elephantSound.play().catch(error => console.log('Error playing sound:', error));
    }
  }
  
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

      // Increase ear size
      const earSize = faceHeight * 1.2; // Increased from 0.8 to 1.2

      // Calculate ear positions
      const leftEarX = leftEar.x * canvasElement.width - earSize * 0.4;
      const rightEarX = rightEar.x * canvasElement.width - earSize * 0.6;
      const earY = topHead.y * canvasElement.height - earSize * 0.3; // Moved up slightly

      // Set composition mode to respect transparency
      canvasCtx.globalCompositeOperation = 'source-over';

      // Calculate flap offset for side-to-side movement
      const flapOffset = Math.sin(flapAngle) * 20; // Adjust 20 for more or less flap

      // Draw flapping ears
      drawFlappingEar(leftEarImage, leftEarX - flapOffset, earY, earSize, -flapOffset);
      drawFlappingEar(rightEarImage, rightEarX + flapOffset, earY, earSize, flapOffset);
    }
  }
  canvasCtx.restore();

  // Update flap angle
  flapAngle += flapSpeed;
}

function drawFlappingEar(image, x, y, size, flapOffset) {
  canvasCtx.save();
  canvasCtx.translate(x + size / 2, y + size / 2);
  
  // Apply skew transform for side-to-side movement
  canvasCtx.transform(1, 0, Math.tan(flapOffset * Math.PI / 180) * 0.2, 1, 0, 0);
  
  canvasCtx.drawImage(image, -size / 2, -size / 2, size, size);
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