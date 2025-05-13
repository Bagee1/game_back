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


from tensorflow.keras.preprocessing.image import ImageDataGenerator

train_datagen = ImageDataGenerator(
    rotation_range=40,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.3,
    zoom_range=0.3,
    horizontal_flip=True,
    brightness_range=[0.8,1.2],
    fill_mode='nearest'
)
# Нүүрийг тасдан авч массив үүсгэх
X_train = np.array([process_face(img) for img in raw_train_images])
y_train = ...  # one-hot энкодинг

train_gen = train_datagen.flow(
    X_train, y_train,
    batch_size=32,
    shuffle=True
)


from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, ReduceLROnPlateau, EarlyStopping

# 1) Optimizer
optimizer = Adam(
    learning_rate=0.001  # Анхны суралтын хурд
)

# 2) Loss функц
loss = 'categorical_crossentropy'

# 3) Batch хэмжээ
batch_size = 32

# 4) Callback-ууд
callbacks = [
    # a) Моделийн шилмэл үнэлгээ хадгалах
    ModelCheckpoint(
        filepath='best_model.h5',
        monitor='val_accuracy',
        save_best_only=True,
        mode='max',
        verbose=1
    ),
    # b) Суралтын хурдыг бууруулах
    ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.2,       # Шинэ суралтын хурд = хуучин * factor
        patience=3,       # 3 үеийн дараа идэвхжих
        min_lr=1e-5,      # Доод суралтын хурд
        verbose=1
    ),
    # c) Эрт зогсоох
    EarlyStopping(
        monitor='val_loss',
        patience=10,       # 10 үеийн турш val_loss буурахгүй бол зогсоох
        restore_best_weights=True,
        verbose=1
    )
]

# Моделийг compile хийх
model.compile(
    optimizer=optimizer,
    loss=loss,
    metrics=['accuracy']
)
