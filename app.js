const playerElement = document.querySelector('.unhruush');
const obstacleElement = document.querySelector('.obstacle');
const scoreElement = document.querySelector('.score-card .score');
const highScoreElement = document.querySelector('.score-card .high-score');
const restartGameElement = document.querySelector('.restart-game');
const gameContainerElement = document.querySelector('.game-container');
const cameraFeedbackElement = document.querySelector('#cameraFeedback');

const emotionToEmojiMap = {
    'Happy': './assets/bayrlah_unhruush.png',
    'Angry': './assets/uurlah_unhruush.png',
    'Sad': './assets/uilah_unhruush.png',
    'Surprised': './assets/gaihal_unhruush.png',
    'Fear': './assets/aidas_unhruush.png',
    'Disgust': './assets/jigshil_unhruush.png'
};

const emotionMap = {
    'Happy': './assets/emgen.png', 
    'Angry': './assets/uvgun.png', 
    'Surprised': './assets/tuulai.png', 
    'Sad': './assets/chono.png', 
    'Fear': './assets/baiwgai.png',
    'Disgust': './assets/uneg.png' 
};

// Face detection variables
let wsConnection = null;
let faceDetectionActive = false;
let videoStream = null;

/**
 * FACE DETECTION
 */
function connectToFaceDetection() {
    wsConnection = new WebSocket('ws://localhost:8000/ws/emotion');
    wsConnection.onopen = () => {
        console.log('Connected to face detection API');
        faceDetectionActive = true;
        startVideoStream();
    };
    wsConnection.onclose = () => {
        console.log('Disconnected from face detection API');
        faceDetectionActive = false;
    };
    wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
        faceDetectionActive = false;
    };
    wsConnection.onmessage = (message) => {
        try {
            const data = JSON.parse(message.data);
            const topEmotion = data?.top?.label;
            console.log('Detected emotion:', topEmotion, data); // Add this line
            if (topEmotion && emotionToEmojiMap[topEmotion]) {
                updateUnhruushFace(topEmotion);
            }
        } catch (err) {
            console.error('Emotion parse error:', err);
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
                cameraFeedbackElement.innerHTML = '';
                cameraFeedbackElement.appendChild(video);
                cameraFeedbackElement.style.display = 'block';
                const sendFrame = () => {
                    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0);
                        canvas.toBlob((blob) => {
                            if (blob) { // Only proceed if blob is not null
                                const reader = new FileReader();
                                reader.onload = () => {
                                    wsConnection.send(reader.result);
                                };
                                reader.readAsArrayBuffer(blob);
                            } else {
                                // Optionally log or handle the null blob case
                                // console.warn('Canvas toBlob returned null');
                            }
                        }, 'image/jpeg', 0.7);
                    }
                    if (faceDetectionActive) {
                        setTimeout(sendFrame, 100); // Send every 100ms
                    }
                };
                sendFrame();
            })
            .catch(function(error) {
                console.error('Camera error:', error);
                alert('Could not access camera. Please check permissions.');
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

let emojiIndex = 0;
const emojiKeys = ['Happy', 'Angry', 'Surprised', 'Sad', 'Fear', 'Disgust'];
let currentEmojiEmotion = emojiKeys[emojiIndex];
let correctEmojisCount = 0;

function loadNextEmoji() {
    const emojiContainer = document.querySelector('.emoji');
    emojiContainer.style.opacity = '0'; // 1. Fade out
    emojiContainer.classList.remove('enter'); // remove previous animation class if any
    void emojiContainer.offsetWidth; // force reflow for re-adding animation

    // 1.5 секундийн дараа backgroundImage болон index-г солих
    setTimeout(() => {
        currentEmojiEmotion = emojiKeys[emojiIndex]; // Дараагийн emoji-г оноох
        emojiContainer.style.backgroundImage = `url(${emotionMap[currentEmojiEmotion]})`;
        emojiContainer.classList.add('enter'); // add animation class for slide-in
        emojiContainer.style.opacity = '1'; // Fade in

        // BG зураг солих логик (fade)
        const fadeBg = (newBg) => {
            gameContainerElement.style.transition = 'opacity 0.5s linear';
            gameContainerElement.style.opacity = '0';
            setTimeout(() => {
                gameContainerElement.style.backgroundImage = newBg;
                gameContainerElement.style.opacity = '1';
                // Дахин transition-г background-image-д зориулж сэргээх
                setTimeout(() => {
                    gameContainerElement.style.transition = 'background-image 0.5s linear, opacity 0.5s linear';
                }, 500);
            }, 500);
        };
        if (emojiIndex === 2) {
            fadeBg("url('./assets/image 2.png')");
        }
        if (emojiIndex == 3) {
            fadeBg("url('./assets/image 3.png')");
        }
        if (emojiIndex == 4) {
            fadeBg("url('./assets/image 4.png')");
        }

        setTimeout(() => {
            emojiContainer.classList.remove('enter'); 
            emojiIndex = (emojiIndex + 1) % emojiKeys.length;
        }, 1500);
    }, 1500); // 1.5s fade out дараа зураг солих
}

function showWinModal() {
    stopGame();
    const winModal = document.getElementById('winModal');
    if (winModal) {
        winModal.style.display = 'flex';
    }
}

function updateUnhruushFace(emotion) {
    const img = emotionToEmojiMap[emotion];
    if (img) {
        playerElement.style.transition = 'opacity 0.5s ease';
        playerElement.style.opacity = '0'; // Fade out
        setTimeout(() => {
            playerElement.style.backgroundImage = `url(${img})`;
            playerElement.style.opacity = '1'; // Fade in
        }, 300);

        // Оноо зөвхөн нэг удаа нэмэгдүүлэх хамгаалалт
        if (emotion === currentEmojiEmotion && currentEmojiEmotion !== null) {
            setScore(score + 10);
            correctEmojisCount++;
            // Дараагийн emoji солигдох хүртэл оноо дахин нэмэгдэхээс сэргийлэх
            currentEmojiEmotion = null;
            if (correctEmojisCount === emojiKeys.length) {
                setTimeout(() => {
                    showWinModal();
                }, 500);
            }
            const emojiContainer = document.querySelector('.emoji');
            if (emojiContainer) {
                emojiContainer.style.opacity = '0';
                setTimeout(() => {
                    loadNextEmoji();
                }, 300);
            }
        }
    }
}
/**
 * SCORE SYSTEM
 */
let score = 0;
function setScore(newScore) {
    scoreElement.innerHTML = score = newScore;
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
 * EMOJI SYSTEM
//todo emoji дарааллаараа буюу index -ээрээ ба дэлгэц дээр гарч ирэх ёстой хэрвээ Emoji таавал автоматаар дараагийнх солигдож байх ёстой
let emojiIndex = 0;
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
    setHighScore(highscore);
    connectToFaceDetection();
    loadNextEmoji(); // Эхний emoji гаргах
}


main();