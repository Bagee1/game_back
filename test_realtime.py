# test_realtime.py

import cv2
import asyncio
import websockets
import json

async def main():
    uri = "ws://localhost:8000/ws/mouth"
    # Камераг нээх
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Камераг нээж чадахгүй байна")
        return

    async with websockets.connect(uri) as ws:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # JPEG болгож шахах
            _, buf = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 50])
            await ws.send(buf.tobytes())

            # Серверээс JSON хариу хүлээх
            data = await ws.recv()
            resp = json.loads(data)
            mouth_open = resp.get("mouth_open", False)

            # Видео дээр бичих
            text = "MOUTH OPEN" if mouth_open else "MOUTH CLOSED"
            color = (0,255,0) if mouth_open else (0,0,255)
            cv2.putText(frame, text, (30,30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

            cv2.imshow("Real-time Mouth Test", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    asyncio.run(main())
