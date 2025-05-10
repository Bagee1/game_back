# test_emotion_all_probs.py

import asyncio
import json

import cv2
import websockets

async def realtime_test_all():
    uri = "ws://localhost:8000/ws/emotion"
    async with websockets.connect(uri) as ws:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Error: Webcam-аас кадр авч чадсангүй.")
            return

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                # JPEG болгож кодлох
                success, buffer = cv2.imencode('.jpg', frame)
                if not success:
                    continue

                # Сервер рүү явуулах
                await ws.send(buffer.tobytes())

                # Серверээс JSON дүнг хүлээн авах
                resp = await ws.recv()
                data = json.loads(resp)

                # Консолд хэвлэх
                print("All predictions:")
                for label, prob in data.get("predictions", {}).items():
                    print(f"  {label}: {prob*100:.1f}%")
                print("-" * 30)

                # Кадр дээр бүх магадлалыг харуулах
                y0 = 30
                for i, (label, prob) in enumerate(data.get("predictions", {}).items()):
                    text = f"{label}: {prob*100:.1f}%"
                    y = y0 + i * 20
                    cv2.putText(frame,
                                text,
                                (10, y),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.6, (0,255,0), 1)

                # Цонхонд харуулна
                cv2.imshow("Real-time Emotions (All %)", frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

        finally:
            cap.release()
            cv2.destroyAllWindows()

if __name__ == "__main__":
    asyncio.run(realtime_test_all())
