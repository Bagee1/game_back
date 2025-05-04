import asyncio, websockets, cv2

async def test_ws():
    uri = "ws://localhost:8000/ws/mouth"
    async with websockets.connect(uri) as ws:
        img = cv2.imread("test.jpg")
        _, buf = cv2.imencode(".jpg", img)
        await ws.send(buf.tobytes())
        print(await ws.recv())

asyncio.run(test_ws())
