import cv2
import numpy as np
import json
import tensorflow as tf
import matplotlib.pyplot as plt

from pathlib import Path

# ==========================================
# 1. LOAD TRAINED MODEL
# ==========================================

MODEL_PATH = "new_soil_results/best_soil_mobilenetv2.keras"
CLASS_PATH = "new_soil_results/class_names.json"

model = tf.keras.models.load_model(MODEL_PATH)

with open(CLASS_PATH, "r") as f:
    class_names = json.load(f)

print("Model loaded successfully!")
print("Classes:", class_names)

# ==========================================
# 2. SELECT TEST IMAGE
# ==========================================

IMAGE_PATH = r"C:\Users\aksha\Downloads\Soil\train\Laterite_Soil\Laterite_Soil_N92_P45_K167_jpg.rf.48b0f58ed5b6b80a4cf63555164d1434.jpg"

# ==========================================
# 3. LOAD AND PREPROCESS IMAGE
# ==========================================

image = cv2.imread(IMAGE_PATH)

if image is None:
    raise FileNotFoundError(f"Image not found: {IMAGE_PATH}")

# OpenCV uses BGR; convert to RGB
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

resized = cv2.resize(image_rgb, (224, 224))

# Match the MobileNetV2 preprocessing used during training
input_image = resized.astype(np.float32)
input_image = np.expand_dims(input_image, axis=0)

# ==========================================
# 4. PREDICTION
# ==========================================

predictions = model.predict(input_image, verbose=0)[0]

predicted_index = np.argmax(predictions)
predicted_class = class_names[predicted_index]
confidence = predictions[predicted_index] * 100

print("\n==============================")
print("SOIL CLASSIFICATION RESULT")
print("==============================")

print("Predicted Soil:", predicted_class)
print(f"Confidence: {confidence:.2f}%")

print("\nAll Class Probabilities:")

for name, probability in zip(class_names, predictions):
    print(f"{name}: {probability * 100:.2f}%")

# ==========================================
# 5. DISPLAY IMAGE AND RESULT
# ==========================================

plt.figure(figsize=(8, 6))
plt.imshow(image_rgb)
plt.title(
    f"Prediction: {predicted_class}\nConfidence: {confidence:.2f}%"
)
plt.axis("off")
plt.show()