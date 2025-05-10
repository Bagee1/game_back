const playerElement = document.querySelector('.player');
const obstacleElement = document.querySelector('.obstacle');
const scoreElement = document.querySelector('.score-card .score');
const highScoreElement = document.querySelector('.score-card .high-score');
const restartGameElement = document.querySelector('.restart-game');
const gameContainerElement = document.querySelector('.game-container');
const cameraFeedbackElement = document.querySelector('#cameraFeedback');
const toggleMouthBtn = document.querySelector('#toggleMouthDetection');

const OBSTACLE_SIZES = ['xs','s','m','l'];

// Face detection variables
let wsConnection = null;
let mouthOpen = false;
let mouthDetectionActive = false;
let videoStream = null;

/**
 * JUMP CONTROLS
 */
function addJumpListener() {
    document.addEventListener('keydown', event => {
        if(event.key === ' ' || event.key === 'ArrowUp') {
            jump();
        }
    });
}

let jumping = false;
function jump() {
    if(jumping) {
        return;
    }

    jumping = true;
    playerElement.classList.add('jump');
    setTimeout(() => {
        playerElement.classList.remove('jump');
        jumping = false;
    }, 1200);
}

/**
 * FACE DETECTION
 */
function connectToMouthDetection() {
    // Change this URL to match your FastAPI server address
    wsConnection = new WebSocket('ws://localhost:8000/ws/mouth');
    
    wsConnection.onopen = () => {
        console.log('Connected to mouth detection API');
        mouthDetectionActive = true;
        toggleMouthBtn.textContent = 'Disable Mouth Control';
        startVideoStream();
    };
    
    wsConnection.onclose = () => {
        console.log('Disconnected from mouth detection API');
        mouthDetectionActive = false;
        toggleMouthBtn.textContent = 'Enable Mouth Control';
    };
    
    wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
        mouthDetectionActive = false;
        toggleMouthBtn.textContent = 'Enable Mouth Control';
    };
    
    wsConnection.onmessage = (event) => {
        const data = JSON.parse(event.data);
        mouthOpen = data.mouth_open;
        
        if (mouthOpen) {
            jump();
        }
    };
}

function startVideoStream() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                videoStream = stream;
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                
                // Add video to feedback element
                cameraFeedbackElement.innerHTML = '';
                cameraFeedbackElement.appendChild(video);
                cameraFeedbackElement.style.display = 'block';
                
                // Send frames to the WebSocket server
                const sendFrame = () => {
                    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0);
                        
                        canvas.toBlob((blob) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                                wsConnection.send(reader.result);
                            };
                            reader.readAsArrayBuffer(blob);
                        }, 'image/jpeg', 0.7);
                    }
                    
                    if (mouthDetectionActive) {
                        setTimeout(sendFrame, 100); // Send every 100ms
                    }
                };
                
                sendFrame();
            })
            .catch(function(error) {
                console.error('Camera error:', error);
                alert('Could not access camera. Please check permissions.');
                toggleMouthDetection();
            });
    } else {
        console.error('getUserMedia not supported');
        alert('Camera access not supported in this browser.');
    }
}

function stopVideoStream() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    cameraFeedbackElement.style.display = 'none';
}

function toggleMouthDetection() {
    if (mouthDetectionActive) {
        // Disable mouth detection
        if (wsConnection) {
            wsConnection.close();
        }
        mouthDetectionActive = false;
        toggleMouthBtn.textContent = 'Enable Mouth Control';
    } else {
        // Enable mouth detection
        connectToMouthDetection();
    }
}

/**
 * COLLISION DETECTION
 */
let collisionInterval;
function monitorCollision() {
    collisionInterval = setInterval(() => {
        if(isCollision()) {
            checkForHighScore();
            stopGame();
        }
    }, 10);
}

const LEFT_BUFFER = 50;
function isCollision() {
    const playerClientRect = playerElement.getBoundingClientRect();
    const playerL = playerClientRect.left;
    const playerR = playerClientRect.right;
    const playerB = playerClientRect.bottom;
    
    const obstacleClientRect = obstacleElement.getBoundingClientRect();
    const obstacleL = obstacleClientRect.left;
    const obstacleR = obstacleClientRect.right;
    const obstacleT = obstacleClientRect.top;

    const xCollision = (obstacleR - LEFT_BUFFER) > playerL && obstacleL < playerR;
    const yCollision = playerB > obstacleT;

    return xCollision && yCollision;
}

/**
 * SCORE SYSTEM
 */
let score = 0;
function setScore(newScore) {
    scoreElement.innerHTML = score = newScore;
}

let scoreInterval;
function countScore() {
    scoreInterval = setInterval(() => {
        setScore(score + 1);
    }, 100);
}

let highscore = localStorage.getItem('highscore') || 0;
function setHighScore(newScore) {
    highScoreElement.innerText = highscore = newScore;
    localStorage.setItem('highscore', newScore);
}

function checkForHighScore() {
    if(score > highscore) {
        setHighScore(score);
    }
}

/**
 * OBSTACLE SYSTEM
 */
function getRandomObstacleSize() {
    const index = Math.floor(Math.random() * (OBSTACLE_SIZES.length - 1));
    return OBSTACLE_SIZES[index];
}

let changeObstacleInterval;
function randomiseObstacle() {
    changeObstacleInterval = setInterval(() => {
        const obstacleSize = getRandomObstacleSize();
        obstacleElement.className = `obstacle obstacle-${obstacleSize}`;
    }, 3000);
}

/**
 * GAME CONTROL
 */
function stopGame() {
    clearInterval(collisionInterval);
    clearInterval(scoreInterval);
    clearInterval(changeObstacleInterval);
    restartGameElement.classList.add('show');
    gameContainerElement.classList.add('stop');
    stopVideoStream();
}

function restart() {
    location.reload();
}

/**
 * INITIALIZE GAME
 */
function main() {
    addJumpListener();
    monitorCollision();
    countScore();
    setHighScore(highscore);
    randomiseObstacle();
};

main();