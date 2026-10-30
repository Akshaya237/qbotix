import os
import zipfile
import hashlib
import json
from pathlib import Path

import numpy as np
import tensorflow as tf

from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from collections import Counter

# =========================================================
# 1. CONFIGURATION
# =========================================================

ZIP_PATH = r"C:\Users\aksha\Downloads\SoilClassification.v2-it_1.folder.zip"

EXTRACT_DIR = Path("soil_new_dataset")
OUTPUT_DIR = Path("new_soil_results")

IMG_SIZE = 224
BATCH_SIZE = 32
SEED = 42

EPOCHS_HEAD = 20
EPOCHS_FINE_TUNE = 15

CLASS_NAMES = [
    "Alluvial soil",
    "Black Soil",
    "Clay soil",
    "Red soil"
]

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

tf.keras.utils.set_random_seed(SEED)

# =========================================================
# 2. EXTRACT DATASET
# =========================================================

if not EXTRACT_DIR.exists():
    EXTRACT_DIR.mkdir(parents=True)

    with zipfile.ZipFile(ZIP_PATH, "r") as zip_ref:
        zip_ref.extractall(EXTRACT_DIR)

print("Dataset extracted.")

# Find the directory containing train/
dataset_root = None

for folder in [EXTRACT_DIR] + list(EXTRACT_DIR.rglob("*")):
    if folder.is_dir() and (folder / "train").is_dir():
        dataset_root = folder
        break

if dataset_root is None:
    raise FileNotFoundError("Could not find the dataset train folder.")

print("Dataset root:", dataset_root)

# =========================================================
# 3. COLLECT IMAGES FROM ALL THREE FOLDERS
# =========================================================

image_paths = []
labels = []

seen_hashes = set()

for split in ["train", "valid", "test"]:

    split_dir = dataset_root / split

    if not split_dir.exists():
        continue

    for class_id, class_name in enumerate(CLASS_NAMES):

        class_dir = split_dir / class_name

        if not class_dir.exists():
            continue

        for image_path in class_dir.rglob("*"):

            if image_path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue

            # Avoid including exact duplicate image files
            digest = hashlib.sha256(image_path.read_bytes()).hexdigest()

            if digest in seen_hashes:
                continue

            seen_hashes.add(digest)

            image_paths.append(str(image_path))
            labels.append(class_id)

image_paths = np.array(image_paths)
labels = np.array(labels)

if len(image_paths) == 0:
    raise ValueError("No images found. Check the ZIP path and folder structure.")

print("\nTOTAL UNIQUE IMAGES:", len(image_paths))

print("\nCLASS DISTRIBUTION:")
for class_id, class_name in enumerate(CLASS_NAMES):
    print(f"{class_name}: {np.sum(labels == class_id)}")

# =========================================================
# 4. CREATE STRATIFIED TRAIN / VALIDATION / TEST SPLITS
# =========================================================

X_train, X_temp, y_train, y_temp = train_test_split(
    image_paths,
    labels,
    test_size=0.20,
    random_state=SEED,
    stratify=labels
)

X_valid, X_test, y_valid, y_test = train_test_split(
    X_temp,
    y_temp,
    test_size=0.50,
    random_state=SEED,
    stratify=y_temp
)

print("\nSPLIT COUNTS")
print("Training:", len(X_train))
print("Validation:", len(X_valid))
print("Testing:", len(X_test))

# =========================================================
# 5. BUILD TENSORFLOW DATASETS
# =========================================================

AUTOTUNE = tf.data.AUTOTUNE

def load_image(path, label):

    image = tf.io.read_file(path)

    image = tf.io.decode_image(
        image,
        channels=3,
        expand_animations=False
    )

    image.set_shape([None, None, 3])

    image = tf.image.resize(
        image,
        [IMG_SIZE, IMG_SIZE]
    )

    image = tf.cast(image, tf.float32)

    label = tf.cast(label, tf.int32)

    return image, label


def create_dataset(paths, labels, training=False):

    dataset = tf.data.Dataset.from_tensor_slices(
        (paths, labels)
    )

    if training:
        dataset = dataset.shuffle(
            buffer_size=len(paths),
            seed=SEED
        )

    dataset = dataset.map(
        load_image,
        num_parallel_calls=AUTOTUNE
    )

    dataset = dataset.batch(BATCH_SIZE)
    dataset = dataset.prefetch(AUTOTUNE)

    return dataset


train_ds = create_dataset(X_train, y_train, training=True)
valid_ds = create_dataset(X_valid, y_valid)
test_ds = create_dataset(X_test, y_test)

# =========================================================
# 6. CLASS WEIGHTS FOR IMBALANCED DATA
# =========================================================

weights = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(y_train),
    y=y_train
)

class_weights = {
    int(class_id): float(weight)
    for class_id, weight in zip(np.unique(y_train), weights)
}

print("\nCLASS WEIGHTS:", class_weights)

# =========================================================
# 7. BUILD MOBILENETV2 MODEL
# =========================================================

base_model = tf.keras.applications.MobileNetV2(
    weights="imagenet",
    include_top=False,
    input_shape=(IMG_SIZE, IMG_SIZE, 3)
)

base_model.trainable = False

inputs = tf.keras.Input(
    shape=(IMG_SIZE, IMG_SIZE, 3)
)

# Data augmentation
x = tf.keras.layers.RandomFlip("horizontal")(inputs)
x = tf.keras.layers.RandomRotation(0.08)(x)
x = tf.keras.layers.RandomZoom(0.10)(x)
x = tf.keras.layers.RandomContrast(0.10)(x)

# MobileNetV2 preprocessing: pixel range 0-255 to -1 to +1
x = tf.keras.layers.Rescaling(
    scale=1.0 / 127.5,
    offset=-1
)(x)

x = base_model(x, training=False)

x = tf.keras.layers.GlobalAveragePooling2D()(x)
x = tf.keras.layers.Dropout(0.35)(x)

x = tf.keras.layers.Dense(
    128,
    activation="relu"
)(x)

x = tf.keras.layers.Dropout(0.25)(x)

outputs = tf.keras.layers.Dense(
    len(CLASS_NAMES),
    activation="softmax"
)(x)

model = tf.keras.Model(inputs, outputs)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# =========================================================
# 8. CALLBACKS
# =========================================================

BEST_MODEL_PATH = OUTPUT_DIR / "best_soil_mobilenetv2.keras"

callbacks = [
    tf.keras.callbacks.ModelCheckpoint(
        filepath=str(BEST_MODEL_PATH),
        monitor="val_accuracy",
        save_best_only=True,
        mode="max",
        verbose=1
    ),

    tf.keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=6,
        restore_best_weights=True,
        verbose=1
    ),

    tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.3,
        patience=3,
        min_lr=1e-7,
        verbose=1
    )
]

# =========================================================
# 9. STAGE 1: TRAIN CLASSIFICATION HEAD
# =========================================================

print("\nSTAGE 1: TRAINING CLASSIFICATION HEAD")

history_head = model.fit(
    train_ds,
    validation_data=valid_ds,
    epochs=EPOCHS_HEAD,
    class_weight=class_weights,
    callbacks=callbacks
)

# =========================================================
# 10. STAGE 2: FINE-TUNE MOBILENETV2
# =========================================================

print("\nSTAGE 2: FINE-TUNING MOBILENETV2")

base_model.trainable = True

# Keep earlier layers frozen; fine-tune only the last 30
for layer in base_model.layers[:-30]:
    layer.trainable = False

# Keep Batch Normalization layers frozen for stability
for layer in base_model.layers:
    if isinstance(layer, tf.keras.layers.BatchNormalization):
        layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

history_fine = model.fit(
    train_ds,
    validation_data=valid_ds,
    epochs=EPOCHS_FINE_TUNE,
    class_weight=class_weights,
    callbacks=callbacks
)

# =========================================================
# 11. LOAD BEST MODEL AND EVALUATE ON TEST SET
# =========================================================

best_model = tf.keras.models.load_model(BEST_MODEL_PATH)

test_loss, test_accuracy = best_model.evaluate(test_ds)

print("\n==============================")
print("FINAL TEST RESULTS")
print("==============================")
print(f"Test Loss: {test_loss:.4f}")
print(f"Test Accuracy: {test_accuracy * 100:.2f}%")

# =========================================================
# 12. SAVE CLASS NAMES
# =========================================================

with open(OUTPUT_DIR / "class_names.json", "w") as file:
    json.dump(CLASS_NAMES, file, indent=4)

print("\nTRAINING COMPLETED")
print("Best model:", BEST_MODEL_PATH)
print("Class names:", OUTPUT_DIR / "class_names.json")