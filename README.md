## Төсөл: Real-Time Emotion Recognition WebSocket Service

Энэхүү төсөл нь FastAPI болон OpenCV (Haar Cascade) болон/эсвэл TensorFlow/Keras моделийг ашиглан real-time горимд нүүрний сэтгэгдэл (emotion) илрүүлэн WebSocket руу JSON хэлбэрээр буцаадаг сервер юм. Next.js эсвэл бусад WebSocket клиенттэй хослуулан front-end-д ашиглахад тохиромжтой.

### Файлын бүтэц

```
game_api/                       # Төслийн үндсэн фолдер
├─ venv/                        # Python виртуал орчин (коммит хийхгүй)
├─ face_api/                    # FastAPI серверийн модуль
│   ├─ app.py                   # Ам нээх detection WebSocket код
│   └─ facial_exp_api.py        # Emotion recognition WebSocket код
├─ test_ws.py                   # Нэг кадрын тест клиент (Python скрипт)
├─ test_realtime.py             # Үйлдлийн real-time тест клиент (Python скрипт)
├─ test_emotion_ws.py           # Нэг кадрын emotion тест клиент (Python скрипт)
├─ test_emotion_realtime.py     # Emotion real-time тест клиент (Python скрипт)
├─ test_face.jpg                # Туршилтын нүүртэй зураг
├─ requirements.txt             # Хамаарлуудын жагсаалт
└─ .gitignore                   # venv/, __pycache__, *.pyc файлуудыг агуулахгүй
```

game_api/ # Төслийн үндсэн фолдер
├─ venv/ # Python виртуал орчин (коммит хийхгүй)
├─ face_api/ # FastAPI серверийн модуль
│ └─ facial_exp_api.py # WebSocket endpoint бүхий код
├─ test_emotion_ws.py # Нэг кадр илгээх тест клиент (Python скрипт)
├─ test_emotion_realtime.py # Real-time WebSocket тест клиент (Python скрипт)
├─ test_face.jpg # Туршилтын зураг (нүүртэй sample)
├─ requirements.txt # Хамаарлуудын жагсаалт
└─ .gitignore # venv/, **pycache**, \*.pyc файлуудыг агуулахгүй

````

### Шаардлага

- Python 3.8+ (3.11+ санал болгож байна)
- Windows эсвэл Linux/WSL орчин
- Вэб камер

### Орчны бэлтгэл

1. Виртуал орчин үүсгэх:
   ```bash
   cd C:/Projects/game_api
   python -m venv venv        # Windows
   .\venv\Scripts\activate  # PowerShell
   # эсвэл bash: source venv/bin/activate
````

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
opencv-python
mediapipe        # хэрвээ FaceMesh ашиглах бол
tensorflow       # Keras модель inference
numpy
websockets       # тест клиентэд
```

### Сервер ажиллуулах

```bash
uvicorn face_api.facial_exp_api:app --reload --host 0.0.0.0 --port 8000
```

- Дараа нь `http://localhost:8000/docs` гэж ороход Swagger UI харагдана.
- WebSocket endpoint: `ws://localhost:8000/ws/emotion`

### API нь WebSocket-ээр дараах JSON обьектыг буцаадаг /жишээ/

```
{
  "predictions": {
    "Angry": 0.02,
    "Disgust": 0.01,
    "Fear": 0.05,
    "Happy": 0.70,
    "Neutral": 0.15,
    "Sad": 0.03,
    "Surprise": 0.04
  },
  "top": {
    "label": "Happy",
    "probability": 0.70
  }
}

```

---

### Нэг кадрын тест

```bash
python test_emotion_ws.py
```

- `test_emotion_ws.py` скрипт нь `test_face.jpg` файлыг сервер рүү илгээж, JSON хариу авна.

### Real-time тест

```bash
python test_emotion_realtime.py
```

- Камерын кадр бүрийг сервер рүү явуулж, цонх дээр ангилал + магадлалыг харуулна.
- `q` товч дарахад зогсоно.

### Client-side кодууд (жишээ)

- HTML/JS canvas + WebSocket ашиглан кадр илгээх жишээ фронтенд кодыг өмнөх чат дээр үзүүлсэн.

### .gitignore

```
venv/
__pycache__/
*.pyc
```

---

### Өнөөдөр хийсэн зүйлс

- WebSocket `/ws/mouth` болон `/ws/emotion` endpoint-уудыг кодчилж тестэлсэн
- Python real-time болон нэг кадрын тест скриптүүдийг (test_ws.py, test_realtime.py, test_emotion_ws.py, test_emotion_realtime.py) боловсруулсан
- `facial_exp_api.py` дотор MODEL_PATH тохиргоо, Haarcascade болон TensorFlow/Keras моделийг нэгтгэн ажиллуулах тохиргоог нэмж оруулсан
- README.md-д файлын бүтэц, шаардлага, тест зааварчилгаа болон ажиллуулах зааврыг шинэчлэн оруулсан

---
Хэрвээ нэг командоор бүгдийг зэрэг ажиллуулахыг хүсвэл PowerShell-д зориулсан дараах скрипт ашиглаж болно:
uvicorn face_api.app:app --host 0.0.0.0 --port 8001
uvicorn face_api.facial_exp_api:app --host 0.0.0.0 --port 8002
uvicorn api_gateway:app --host 0.0.0.0 --port 8000