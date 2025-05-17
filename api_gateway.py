# api_gateway.py
# FastAPI дээр суурилсан API Gateway
# Энэ файл нь хоёр backend websocket endpoint-ууд руу proxy хийнэ.

import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import websockets

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Backend-уудын хаяг
MOUTH_WS_BACKEND = "ws://localhost:8001/ws/mouth"
EMOTION_WS_BACKEND = "ws://localhost:8002/ws/emotion"

async def proxy_ws(client_ws: WebSocket, backend_url: str):
    await client_ws.accept()
    try:
        async with websockets.connect(backend_url) as backend_ws:
            async def client_to_backend():
                while True:
                    data = await client_ws.receive_bytes()
                    await backend_ws.send(data)

            async def backend_to_client():
                while True:
                    msg = await backend_ws.recv()
                    # backend-аас ирсэн мессеж JSON гэж үзнэ
                    await client_ws.send_text(msg)

            await asyncio.gather(client_to_backend(), backend_to_client())
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await client_ws.close()

@app.websocket("/ws/mouth")
async def ws_mouth(client_ws: WebSocket):
    await proxy_ws(client_ws, MOUTH_WS_BACKEND)

@app.websocket("/ws/emotion")
async def ws_emotion(client_ws: WebSocket):
    await proxy_ws(client_ws, EMOTION_WS_BACKEND)
