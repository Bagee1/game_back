# face_api/app.py

import io
import cv2
import numpy as np
import mediapipe as mp
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Mediapipe FaceMesh-ийг нэг л удаа ачаалж байна
mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

def detect_mouth_open(frame: np.ndarray, threshold: float = 0.08) -> bool:
    """
    Нэг кадр (BGR numpy array) дээр_mp_face_mesh_ ашиглан
    дээд доод уруулын зайгаар mouth_open эсэхийг тооцоолно.
    """
    # BGR→RGB
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = mp_face_mesh.process(rgb)
    if not results.multi_face_landmarks:
        return False

    lm = results.multi_face_landmarks[0].landmark
    h, w, _ = frame.shape

    # Mediapipe landmark index: 13=upper_lip, 14=lower_lip,
    # 234=left_cheek, 454=right_cheek
    ul, ll, lc, rc = lm[13], lm[14], lm[234], lm[454]

    y_top    = int(ul.y * h)
    y_bottom = int(ll.y * h)
    x_left   = int(lc.x * w)
    x_right  = int(rc.x * w)

    # Хэрвээ нүүрийн өргөн буруу тооцогдвол False
    face_width = x_right - x_left
    if face_width <= 0:
        return False

    # Ам нээх харьцаа
    distance = y_bottom - y_top
    return (distance / face_width) > threshold

@app.websocket("/ws/mouth")
async def mouth_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Клиентээс JPEG байтууд ирнэ
            data = await websocket.receive_bytes()
            arr = np.frombuffer(data, dtype=np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if frame is None:
                await websocket.send_json({"error": "invalid frame"})
                continue

            # mediapipe-р mouth-open илрүүлэлт
            is_open = detect_mouth_open(frame)
            await websocket.send_json({"mouth_open": is_open})

    except WebSocketDisconnect:
        pass