import io
import cv2
import numpy as np
from tensorflow.keras.models import load_model
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()
app.add_middleware(

    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Emotion recognition модел болон Haarcascade ачаалж байна

BASE_DIR = os.path.dirname(__file__)                             # …\game_api\face_api
MODEL_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "model", "model.h5"))  # …\game_api\model\model.h5
print("Loading model from:", MODEL_PATH)
CASCADE_PATH = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
model = load_model(MODEL_PATH)
face_cascade = cv2.CascadeClassifier(CASCADE_PATH)

# 2. Ангиллын шошгууд
class_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprised']

async def detect_emotion(frame: np.ndarray, threshold: float = 0.0) -> dict:
    """
    Нэг кадр (BGR numpy array) дээр нүүр илрүүлэн,
    тухайн нүүрний ангийн магадлалын хувь хэмжээг буцаана.
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
    if len(faces) == 0:
        return {"error": "no_face_detected"}

    # Зөвхөн эхний нүүрийг боловсруулах
    x, y, w, h = faces[0]
    roi = gray[y:y+h, x:x+w]
    roi = cv2.resize(roi, (48, 48))
    roi = roi.astype('float32') / 255.0
    roi = np.expand_dims(roi, axis=0)
    roi = np.expand_dims(roi, axis=-1)

    preds = model.predict(roi)[0]
    # Бүх ангиллын магадлал
    probs = {label: float(preds[i]) for i, label in enumerate(class_labels)}
    # Хамгийн өндөр магадлалтай анги
    top_i = int(np.argmax(preds))
    top_label = class_labels[top_i]
    top_prob = float(preds[top_i])

    # if top_prob < 0.51: 
    #     return {"error": "uncertain_prediction"}
    # else:
    #     return {
    #         "predictions": probs,
    #         "top": {"label": top_label, "probability": top_prob}
    #     }
    return {
            "predictions": probs,
            "top": {"label": top_label, "probability": top_prob}
        }
        
@app.websocket("/ws/emotion")
async def emotion_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # JPEG байтууд хүлээн авна
            data = await websocket.receive_bytes()
            arr = np.frombuffer(data, dtype=np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if frame is None:
                await websocket.send_json({"error": "invalid_frame"})
                continue

            # Emotion илрүүлэлт
            result = await detect_emotion(frame)
            await websocket.send_json(result)

    except WebSocketDisconnect:
        pass
