"""
ArduCam Soil Classifier — Inference Script
==========================================
Uses the trained TFLite model to classify a soil image in real-time.

Usage:
    # Single image
    python inference.py --image path/to/soil_photo.jpg

    # Whole folder
    python inference.py --folder path/to/test_images/
"""

import os
import sys
import json
import argparse
import numpy as np
from PIL import Image

# ─────────────────────────────────────────────
# CONFIG  (edit if needed)
# ─────────────────────────────────────────────
DEFAULT_MODEL_PATH  = r"C:\Users\aksha\Downloads\Soil Analysis.v3i.folder\output\soil_classifier.tflite"
DEFAULT_LABELS_PATH = r"C:\Users\aksha\Downloads\Soil Analysis.v3i.folder\output\class_labels.json"
IMG_SIZE = 224   # must match training

# ─────────────────────────────────────────────
# LOAD TFLITE INTERPRETER
# ─────────────────────────────────────────────
def load_interpreter(model_path):
    try:
        import tflite_runtime.interpreter as tflite
        interpreter = tflite.Interpreter(model_path=model_path)
    except ImportError:
        import tensorflow as tf
        interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    return interpreter

def load_labels(labels_path):
    with open(labels_path, "r") as f:
        data = json.load(f)
    return data["classes"]

# ─────────────────────────────────────────────
# PREPROCESS
# ─────────────────────────────────────────────
def preprocess_image(image_path, img_size=IMG_SIZE):
    img = Image.open(image_path).convert("RGB")
    img = img.resize((img_size, img_size), Image.LANCZOS)
    arr = np.array(img, dtype=np.float32)          # [0, 255] — model handles scaling
    arr = np.expand_dims(arr, axis=0)              # [1, H, W, 3]
    return arr

# ─────────────────────────────────────────────
# PREDICTION
# ─────────────────────────────────────────────
def predict(interpreter, image_array):
    input_details  = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    interpreter.set_tensor(input_details[0]["index"], image_array)
    interpreter.invoke()
    probs = interpreter.get_tensor(output_details[0]["index"])[0]
    return probs

def classify_image(image_path, interpreter, class_names):
    img = preprocess_image(image_path)
    probs = predict(interpreter, img)
    pred_idx = np.argmax(probs)
    return {
        "predicted_class": class_names[pred_idx],
        "confidence":      float(probs[pred_idx]),
        "all_scores": {
            c: float(p) for c, p in zip(class_names, probs)
        }
    }

# ─────────────────────────────────────────────
# PRETTY PRINT
# ─────────────────────────────────────────────
BAR_WIDTH = 30
SOIL_EMOJIS = {
    "Black_Soil":    "⬛",
    "Cinder_Soil":   "🟤",
    "Laterite_Soil": "🟠",
    "Peat_Soil":     "🟫",
    "Yellow_Soil":   "🟡",
}

def print_result(image_path, result):
    cls   = result["predicted_class"]
    conf  = result["confidence"]
    emoji = SOIL_EMOJIS.get(cls, "🌱")
    print(f"\n{'─'*50}")
    print(f"  Image  : {os.path.basename(image_path)}")
    print(f"  Result : {emoji}  {cls.replace('_', ' ')}")
    print(f"  Confidence: {conf*100:.1f}%")
    print(f"\n  Probability breakdown:")
    for cls_name, score in sorted(result["all_scores"].items(),
                                   key=lambda x: -x[1]):
        bar = "█" * int(score * BAR_WIDTH)
        print(f"    {cls_name:<18s} {bar:<{BAR_WIDTH}s} {score*100:5.1f}%")
    print(f"{'─'*50}")

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Soil type classifier using ArduCam + TFLite model"
    )
    parser.add_argument("--image",  type=str, help="Path to a single image")
    parser.add_argument("--folder", type=str, help="Path to a folder of images")
    parser.add_argument("--model",  type=str, default=DEFAULT_MODEL_PATH)
    parser.add_argument("--labels", type=str, default=DEFAULT_LABELS_PATH)
    args = parser.parse_args()

    if not args.image and not args.folder:
        parser.print_help()
        sys.exit(1)

    print("[LOAD] Loading TFLite model...")
    interpreter = load_interpreter(args.model)
    class_names = load_labels(args.labels)
    print(f"[LOAD] Model ready. Classes: {class_names}\n")

    img_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

    if args.image:
        result = classify_image(args.image, interpreter, class_names)
        print_result(args.image, result)

    if args.folder:
        images = [os.path.join(args.folder, f)
                  for f in os.listdir(args.folder)
                  if os.path.splitext(f)[1].lower() in img_extensions]
        print(f"[BATCH] Found {len(images)} images in {args.folder}")
        stats = {}
        for img_path in images:
            result = classify_image(img_path, interpreter, class_names)
            cls = result["predicted_class"]
            stats[cls] = stats.get(cls, 0) + 1
            print_result(img_path, result)

        print("\n[BATCH SUMMARY]")
        print(f"  Total images : {len(images)}")
        for cls, count in sorted(stats.items(), key=lambda x: -x[1]):
            pct = count / len(images) * 100
            print(f"  {cls:<20s}: {count:3d} ({pct:.1f}%)")

if __name__ == "__main__":
    main()
