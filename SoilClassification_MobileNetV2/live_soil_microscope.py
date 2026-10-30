import cv2
import numpy as np
import tensorflow as tf
import json
from pathlib import Path

# ==========================================
# 1. LOAD MODEL AND CLASS NAMES
# ==========================================

MODEL_PATH = "new_soil_results/best_soil_mobilenetv2.keras"
CLASS_PATH = "new_soil_results/class_names.json"

model = tf.keras.models.load_model(MODEL_PATH)

with open(CLASS_PATH, "r") as f:
    class_names = json.load(f)

print("MobileNetV2 loaded!")
print("Classes:", class_names)

# ==========================================
# 2. OPEN MICROSCOPE CAMERA
# ==========================================

# Try Media Foundation first on Windows
cap = cv2.VideoCapture(0, cv2.CAP_MSMF)

# If it fails, try DirectShow
if not cap.isOpened():
    cap.release()
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

if not cap.isOpened():
    print("Camera could not be opened.")
    print("Try camera index 1 or 2.")
    exit()

# Request camera resolution
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

print("Microscope camera connected!")
print("Press Q to quit.")
print("Press S to save the current frame.")

# ==========================================
# 3. LIVE PREDICTION
# ==========================================

while True:

    ret, frame = cap.read()

    if not ret:
        print("Could not read camera frame.")
        break

    # Convert BGR to RGB
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Resize to model input size
    resized = cv2.resize(rgb, (224, 224))

    # Match training preprocessing
    input_image = resized.astype(np.float32)
    input_image = np.expand_dims(input_image, axis=0)

    # Prediction
    predictions = model.predict(input_image, verbose=0)[0]

    predicted_index = np.argmax(predictions)
    predicted_class = class_names[predicted_index]
    confidence = predictions[predicted_index] * 100

    # ======================================
    # 4. DISPLAY PREDICTION
    # ======================================

    display = frame.copy()

    cv2.putText(
        display,
        f"Soil: {predicted_class}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (0, 255, 0),
        2
    )

    cv2.putText(
        display,
        f"Confidence: {confidence:.2f}%",
        (20, 80),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 255, 0),
        2
    )

    # Show all class probabilities
    for i, name in enumerate(class_names):

        text = f"{name}: {predictions[i] * 100:.1f}%"

        cv2.putText(
            display,
            text,
            (20, 130 + i * 35),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (255, 255, 0),
            2
        )

    cv2.imshow("Soil Classification - Microscope", display)

    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        break

    elif key == ord("s"):
        cv2.imwrite("microscope_test.jpg", frame)
        print("Image saved as microscope_test.jpg")

# ==========================================
# 5. RELEASE CAMERA
# ==========================================

cap.release()
cv2.destroyAllWindows()

print("Camera testing stopped.")