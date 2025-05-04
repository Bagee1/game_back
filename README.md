# README.md

## Төсөл: Real-Time Mouth Detection WebSocket Service

Энэхүү төсөл нь FastAPI болон OpenCV-ийн Haar Cascade эсвэл MediaPipe FaceMesh-ийг ашиглан ам нээх үйлдлийг real-time горимд илрүүлэн WebSocket руу JSON хэлбэрээр буцаадаг сервер юм. Next.js эсвэл бусад WebSocket клиентүүдтэй хосолсон Dinora мэт тоглоомын front-end-д ашиглахад тохиромжтой.

### Файлын бүтэц

```
game_api/                       # Төслийн үндсэн фолдер
├─ venv/                        # Python виртуал орчин (коммит хийхгүй)
├─ face_api/                    # FastAPI серверийн модуль
│   └─ app.py                   # WebSocket endpoint бүхий код
├─ test_realtime.py             # Real-time WebSocket тест клиент (Python скрипт)
├─ test_ws.py                   # WebSocket нэг кадр илгээх тест клиент
├─ test.jpg                     # Туршилтын зураг (нүүртэй sample)
├─ requirements.txt             # Хамаарлуудын жагсаалт
└─ .gitignore                   # venv/, __pycache__, *.pyc  файлуудыг агуулахгүй
```

### Шаардлага

- Python 3.11+
- Windows (DirectShow) эсвэл Ubuntu (WSL давхарлахгүй) орчин
- Веб камер (камерын индекс зөв тохируулах)

### Орчны бэлтгэл

1. Виртуал орчин үүсгэх:

   ```bash
   cd C:/Projects/game_api
   python -m venv venv         # Windows
   .\venv\Scripts\activate  # PowerShell
   # эсвэл bash: source venv/bin/activate
   ```

2. pip-ээ шинэчлэх:

   ```bash
   pip install --upgrade pip setuptools wheel
   ```

3. Хамаарлуудыг суулгах:

   ```bash
   pip install -r requirements.txt
   ```

### requirements.txt

```
fastapi
uvicorn[standard]
python-multipart
opencv-python
numpy
websockets
mediapipe  # Хэрвээ MediaPipe FaceMesh сонгосон бол
```

### Сервер ажиллуулах

```bash
uvicorn face_api.app:app --reload --host 0.0.0.0 --port 8000
```

- Үүний дараа `http://localhost:8000/docs` гэж ороход Swagger UI харагдана.
- WebSocket endpoint: `ws://localhost:8000/ws/mouth`

### Real-time тест

```bash
python test_realtime.py
```

- Камерын цонх дээр “MOUTH OPEN”/“MOUTH CLOSED” гэж real-time бичигдэнэ.
- `q` товч дарахад зогсоно.

### Нэг кадрын тест

```bash
python test_ws.py
```

- `test_ws.py` скрипт нь нэг кадрын зураг (`test.jpg`) илгээж, серверээс JSON хариу авна.

### Камерын индекс тохируулах (Windows)

`test_realtime.py` дотор:

```python
cap = cv2.VideoCapture(<индекс>, cv2.CAP_DSHOW)
```

- Индексийг олохын тулд `find_camera.py` хутгаар:

```bash
python find_camera.py
```

- Олсон индексээр `cap` үүсгэ.

### Дагалдах файлууд

- `.gitignore`: `venv/`, `__pycache__/`, `*.pyc`
- `README.md`: Энэ файл

---

Ингэж та энэхүү төсөлдөө Python виртуал орчин, FastAPI WebSocket сервер болон real-time mouth-open илрэлт хийх орчныг бүрдүүлж чадна. Амжилт хүсье!
