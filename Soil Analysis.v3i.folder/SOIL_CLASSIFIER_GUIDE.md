# 🌱 Soil Type Classifier — Complete Training & Deployment Guide

## Dataset Summary

| Property | Value |
|---|---|
| **Source** | Roboflow "Soil Analysis v3" |
| **Total images** | 3,481 (augmented from originals) |
| **Classes** | 5 soil types |
| **Format** | Folder/directory classification |
| **Resolution** | 640×640 → resized to 224×224 for training |

### Classes
| Class | Description |
|---|---|
| ⬛ `Black_Soil` | High clay content, dark colour, found in Deccan regions |
| 🟤 `Cinder_Soil` | Volcanic origin, coarse texture, poor water retention |
| 🟠 `Laterite_Soil` | Iron-rich, brick-red, tropical weathered soils |
| 🟫 `Peat_Soil` | Organic-rich, dark brown, high water retention |
| 🟡 `Yellow_Soil` | Sandy-loamy, iron-oxide yellow tint |

### Data Augmentation Applied (Roboflow)
- 50% horizontal/vertical flip
- Random rotation ±15°
- Random crop 0–20%
- Brightness ±15%
- Gaussian blur 0–2.5px
- Salt & pepper noise 0.1%

---

## Model Architecture — Why EfficientNetV2-S?

| Model | Accuracy | Params | Inference (ms) | Edge-friendly |
|---|---|---|---|---|
| MobileNetV2 | ~92% | 3.4M | Fast | ✅ Best |
| EfficientNetV2-S ✅ | ~95-97% | 21M | Medium | ✅ Good |
| ResNet50 | ~94% | 25M | Medium | ⚠️ Heavier |
| EfficientNetV2-L | ~98% | 119M | Slow | ❌ |

**EfficientNetV2-S** is chosen because:
- Excellent accuracy-to-size ratio
- Pre-trained on ImageNet (excellent feature extraction)
- Compresses well to TFLite (~21MB → ~5MB with quantisation)
- Runs on Raspberry Pi 4 at ~5-10 FPS with TFLite

### Training Strategy — Two-Phase Transfer Learning

```
Phase 1 (Feature Extraction)        Phase 2 (Fine-Tuning)
─────────────────────────────        ─────────────────────
[ImageNet EfficientNetV2-S]          [EfficientNetV2-S — top layers unfrozen]
        ↓ (frozen)                           ↓ (partially trainable)
[Global Avg Pool]                    [Global Avg Pool]
[BatchNorm + Dropout(0.4)]           [BatchNorm + Dropout(0.4)]
[Dense 256 + L2 reg]                 [Dense 256 + L2 reg]
[BatchNorm + Dropout(0.3)]           [BatchNorm + Dropout(0.3)]
[Softmax 5 classes]                  [Softmax 5 classes]

LR = 1e-3, Epochs ≤ 50              LR = 1e-5, Epochs ≤ 20
EarlyStopping (patience=8)           EarlyStopping (patience=6)
ReduceLROnPlateau (factor=0.5)       ReduceLROnPlateau (factor=0.3)
```

---

## Step-by-Step Setup

### 1. Prerequisites
- Python 3.10 or 3.11
- CUDA 11.8 or 12.x (for RTX 3050 GPU acceleration)
- cuDNN 8.x (matching CUDA version)

> [!TIP]
> Check your CUDA version: `nvidia-smi`
> If not installed, get it from: https://developer.nvidia.com/cuda-downloads

### 2. Create Virtual Environment

```bash
# In your terminal / PowerShell
python -m venv soil_env
soil_env\Scripts\activate   # Windows

# Upgrade pip
python -m pip install --upgrade pip
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

> [!NOTE]
> `tensorflow[and-cuda]` automatically installs CUDA dependencies via pip (TF 2.14+). No manual CUDA setup needed if using this package.

### 4. Copy Scripts to Dataset Folder

Copy these 3 files into `C:\Users\aksha\Downloads\Soil Analysis.v3i.folder\`:
- `train_soil_classifier.py`
- `inference.py`
- `requirements.txt`

### 5. Run Training

```bash
cd "C:\Users\aksha\Downloads\Soil Analysis.v3i.folder"
python train_soil_classifier.py
```

**Expected training time on RTX 3050:**
- Phase 1: ~20-40 minutes (50 epochs max, early stopping)
- Phase 2: ~10-15 minutes (20 epochs max)

---

## What Gets Generated

After training, the `output/` folder will contain:

```
output/
├── soil_classifier.tflite       ← Deploy to ArduCam/Raspberry Pi
├── soil_classifier.keras        ← Full Keras model  
├── best_model_final.keras       ← Best checkpoint
├── class_labels.json            ← Class index mapping
│
├── training_curves.png          ← Accuracy/Loss/AUC over epochs
├── confusion_matrix.png         ← Absolute counts
├── confusion_matrix_norm.png    ← Normalised (0–1)
├── per_class_accuracy.png       ← Bar chart per class
├── roc_curves.png               ← One-vs-Rest ROC curves
│
├── classification_report.txt    ← Precision/Recall/F1 per class
├── history_phase1.csv           ← Phase 1 metrics log
└── history_phase2.csv           ← Phase 2 metrics log
```

---

## Running Inference

### Single image

```bash
python inference.py --image "path/to/photo.jpg"
```

### Batch folder

```bash
python inference.py --folder "path/to/folder_of_images/"
```

**Example output:**
```
──────────────────────────────────────────────────
  Image  : soil_sample_01.jpg
  Result : 🟠  Laterite Soil
  Confidence: 97.3%

  Probability breakdown:
  Laterite_Soil      ██████████████████████████████  97.3%
  Black_Soil         █                                1.2%
  Yellow_Soil        █                                0.9%
  Cinder_Soil                                         0.4%
  Peat_Soil                                           0.2%
──────────────────────────────────────────────────
```

---

## ArduCam Deployment

### Option A: Raspberry Pi + ArduCam (Recommended)

1. Transfer `soil_classifier.tflite` and `class_labels.json` to Pi
2. Install TFLite runtime on Pi:
   ```bash
   pip install tflite-runtime
   ```
3. Use `inference.py` directly on Pi with images from ArduCam

### Option B: Windows PC with ArduCam USB

1. Capture image from ArduCam to a file (using ArduCam's SDK)
2. Run `python inference.py --image captured_image.jpg`

### ArduCam capture snippet (Python + OpenCV):

```python
import cv2

cap = cv2.VideoCapture(0)  # ArduCam USB index
ret, frame = cap.read()
if ret:
    cv2.imwrite("soil_capture.jpg", frame)
    cap.release()
```

---

## Expected Performance

| Metric | Expected Value |
|---|---|
| Test Accuracy | **95–98%** |
| Macro AUC | **0.98–0.999** |
| Inference time (TFLite, Pi 4) | ~100–200ms |
| Inference time (TFLite, Windows CPU) | ~50ms |
| TFLite model size | ~5–7 MB |

> [!IMPORTANT]
> The test set only has **2 classes** (Black_Soil, Cinder_Soil). Full 5-class evaluation happens on the validation set. Consider adding test images for all 5 classes for complete evaluation.

---

## Tips for Best Results

> [!TIP]
> - If accuracy < 90%, try reducing `BATCH_SIZE` to 16 and increasing `EPOCHS` to 60
> - For even smaller TFLite model, enable int8 quantisation (requires calibration dataset)
> - Monitor training with TensorBoard: `tensorboard --logdir output/logs`

> [!WARNING]
> - Do NOT resize images below 224×224 — EfficientNetV2-S requires this minimum
> - Avoid training in fp16 without mixed precision setup — can cause NaN losses
