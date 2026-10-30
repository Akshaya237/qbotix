
from pathlib import Path
import random
import json

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from torchvision.models import EfficientNet_V2_S_Weights
from PIL import Image

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns


# ============================================================
# 1. CONFIGURATION
# ============================================================

SEED = 42
IMAGE_SIZE = 384
BATCH_SIZE = 4
EPOCHS = 30
LEARNING_RATE = 1e-4
PATIENCE = 7

PROJECT_DIR = Path(__file__).resolve().parent

TRAIN_DIR = PROJECT_DIR / "train"
VALID_DIR = PROJECT_DIR / "valid"
TEST_DIR = PROJECT_DIR / "test"

OUTPUT_DIR = PROJECT_DIR / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("=" * 60)
print("EFFICIENTNETV2-S SOIL CLASSIFICATION")
print("=" * 60)
print("Project directory:", PROJECT_DIR)
print("Device:", device)

if device.type == "cuda":
    print("GPU:", torch.cuda.get_device_name(0))
else:
    print("WARNING: Running on CPU. Training may be slow.")


# ============================================================
# 2. CHECK DATASET FOLDERS
# ============================================================

for folder in [TRAIN_DIR, VALID_DIR, TEST_DIR]:
    if not folder.is_dir():
        raise FileNotFoundError(
            f"Missing dataset folder: {folder}"
        )

print("\nDataset folders found successfully.")


# ============================================================
# 3. COLLECT IMAGES FROM ALL EXISTING SPLITS
# ============================================================

# Your original valid and test folders don't contain all
# five classes. Collect all images and create new stratified
# train/validation/test splits.

all_samples = []

for split_dir in [TRAIN_DIR, VALID_DIR, TEST_DIR]:
    for class_dir in sorted(split_dir.iterdir()):
        if not class_dir.is_dir():
            continue

        for image_path in class_dir.rglob("*"):
            if image_path.suffix.lower() in IMAGE_EXTENSIONS:
                all_samples.append(
                    (str(image_path), class_dir.name)
                )

if not all_samples:
    raise RuntimeError(
        "No images found. Check the train, valid and test folders."
    )

class_names = sorted(set(label for _, label in all_samples))
class_to_idx = {
    name: index for index, name in enumerate(class_names)
}

paths = np.array([path for path, _ in all_samples])
labels = np.array([
    class_to_idx[label] for _, label in all_samples
])

num_classes = len(class_names)

print("\nSoil classes:")
for name in class_names:
    count = sum(label == name for _, label in all_samples)
    print(f"  {name}: {count} images")

print("Total images:", len(all_samples))
print("Number of classes:", num_classes)

# Ensure stratified splitting is possible
class_counts = np.bincount(labels, minlength=num_classes)

if np.any(class_counts < 3):
    raise RuntimeError(
        "At least one class has fewer than 3 images. "
        "Stratified train/validation/test splitting needs "
        "more images in each class."
    )

# First split: 80% training, 20% temporary
train_paths, temp_paths, train_labels, temp_labels = (
    train_test_split(
        paths,
        labels,
        test_size=0.20,
        stratify=labels,
        random_state=SEED
    )
)

# Second split: 10% validation, 10% test overall
valid_paths, test_paths, valid_labels, test_labels = (
    train_test_split(
        temp_paths,
        temp_labels,
        test_size=0.50,
        stratify=temp_labels,
        random_state=SEED
    )
)

print("\nNew dataset splits:")
print("Training:", len(train_paths))
print("Validation:", len(valid_paths))
print("Testing:", len(test_paths))


# ============================================================
# 4. IMAGE TRANSFORMS
# ============================================================

print("\nPreparing image transforms...")

weights = EfficientNet_V2_S_Weights.DEFAULT
preprocess = weights.transforms()

mean = preprocess.mean
std = preprocess.std

train_transform = transforms.Compose([
    transforms.RandomResizedCrop(
        IMAGE_SIZE,
        scale=(0.80, 1.0)
    ),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ColorJitter(
        brightness=0.10,
        contrast=0.10,
        saturation=0.05
    ),
    transforms.ToTensor(),
    transforms.Normalize(mean, std)
])

eval_transform = transforms.Compose([
    transforms.Resize(IMAGE_SIZE + 32),
    transforms.CenterCrop(IMAGE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean, std)
])


# ============================================================
# 5. CUSTOM DATASET
# ============================================================

class SoilDataset(Dataset):

    def __init__(self, image_paths, image_labels, transform):
        self.image_paths = list(image_paths)
        self.image_labels = [int(x) for x in image_labels]
        self.transform = transform

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, index):
        image_path = self.image_paths[index]
        label = self.image_labels[index]

        with Image.open(image_path) as img:
            image = img.convert("RGB")

        image = self.transform(image)

        return image, label


train_dataset = SoilDataset(
    train_paths, train_labels, train_transform
)

valid_dataset = SoilDataset(
    valid_paths, valid_labels, eval_transform
)

test_dataset = SoilDataset(
    test_paths, test_labels, eval_transform
)


# ============================================================
# 6. DATALOADERS
# ============================================================

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=0,
    pin_memory=(device.type == "cuda")
)

valid_loader = DataLoader(
    valid_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0,
    pin_memory=(device.type == "cuda")
)

test_loader = DataLoader(
    test_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0,
    pin_memory=(device.type == "cuda")
)

print("\nDataloaders ready.")


# ============================================================
# 7. LOAD PRETRAINED EFFICIENTNETV2-S
# ============================================================

print("\nLoading pretrained EfficientNetV2-S...")
print("The first run may download pretrained weights.")

model = models.efficientnet_v2_s(weights=weights)

# Replace the final layer for soil classification
in_features = model.classifier[1].in_features

model.classifier[1] = nn.Linear(
    in_features,
    num_classes
)

model = model.to(device)

criterion = nn.CrossEntropyLoss()

optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=LEARNING_RATE,
    weight_decay=1e-4
)

scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer,
    mode="max",
    factor=0.5,
    patience=2
)

scaler = torch.amp.GradScaler(
    "cuda",
    enabled=(device.type == "cuda")
)


# ============================================================
# 8. TRAINING
# ============================================================

best_val_acc = -1.0
best_epoch = 0
epochs_without_improvement = 0

best_model_path = OUTPUT_DIR / "best_efficientnetv2_s.pth"

history = {
    "train_loss": [],
    "train_accuracy": [],
    "val_loss": [],
    "val_accuracy": []
}

print("\nStarting training...\n")

for epoch in range(EPOCHS):

    # ---------------- TRAINING ----------------
    model.train()

    train_loss_sum = 0.0
    train_correct = 0
    train_total = 0

    for images, targets in train_loader:

        images = images.to(device)
        targets = targets.to(device)

        optimizer.zero_grad(set_to_none=True)

        with torch.autocast(
            device_type=device.type,
            enabled=(device.type == "cuda")
        ):
            outputs = model(images)
            loss = criterion(outputs, targets)

        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()

        train_loss_sum += loss.item() * images.size(0)
        train_correct += (
            outputs.argmax(dim=1) == targets
        ).sum().item()
        train_total += targets.size(0)

    train_loss = train_loss_sum / train_total
    train_acc = train_correct / train_total

    # ---------------- VALIDATION ----------------
    model.eval()

    val_loss_sum = 0.0
    val_correct = 0
    val_total = 0

    with torch.no_grad():

        for images, targets in valid_loader:

            images = images.to(device)
            targets = targets.to(device)

            with torch.autocast(
                device_type=device.type,
                enabled=(device.type == "cuda")
            ):
                outputs = model(images)
                loss = criterion(outputs, targets)

            val_loss_sum += loss.item() * images.size(0)
            val_correct += (
                outputs.argmax(dim=1) == targets
            ).sum().item()
            val_total += targets.size(0)

    val_loss = val_loss_sum / val_total
    val_acc = val_correct / val_total

    scheduler.step(val_acc)

    history["train_loss"].append(train_loss)
    history["train_accuracy"].append(train_acc)
    history["val_loss"].append(val_loss)
    history["val_accuracy"].append(val_acc)

    print(
        f"Epoch [{epoch + 1:02d}/{EPOCHS}] "
        f"Train Loss: {train_loss:.4f} | "
        f"Train Acc: {train_acc:.4f} | "
        f"Val Loss: {val_loss:.4f} | "
        f"Val Acc: {val_acc:.4f}"
    )

    # Save best model using validation accuracy
    if val_acc > best_val_acc:

        best_val_acc = val_acc
        best_epoch = epoch + 1
        epochs_without_improvement = 0

        torch.save(
            {
                "model_state_dict": model.state_dict(),
                "class_names": class_names,
                "image_size": IMAGE_SIZE,
                "best_val_accuracy": best_val_acc,
                "best_epoch": best_epoch
            },
            best_model_path
        )

        print("  Best model checkpoint saved.")

    else:
        epochs_without_improvement += 1

    if epochs_without_improvement >= PATIENCE:
        print("\nEarly stopping: validation accuracy has stopped improving.")
        break


# ============================================================
# 9. SAVE TRAINING CURVES
# ============================================================

epoch_numbers = range(1, len(history["train_loss"]) + 1)

plt.figure(figsize=(9, 5))
plt.plot(epoch_numbers, history["train_accuracy"], label="Train")
plt.plot(epoch_numbers, history["val_accuracy"], label="Validation")
plt.xlabel("Epoch")
plt.ylabel("Accuracy")
plt.title("EfficientNetV2-S Accuracy")
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "accuracy_curve.png", dpi=200)
plt.close()

plt.figure(figsize=(9, 5))
plt.plot(epoch_numbers, history["train_loss"], label="Train")
plt.plot(epoch_numbers, history["val_loss"], label="Validation")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.title("EfficientNetV2-S Loss")
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "loss_curve.png", dpi=200)
plt.close()

with open(
    OUTPUT_DIR / "training_history.json",
    "w",
    encoding="utf-8"
) as file:
    json.dump(history, file, indent=2)


# ============================================================
# 10. TEST THE BEST MODEL
# ============================================================

print("\nLoading the best checkpoint for final testing...")

checkpoint = torch.load(
    best_model_path,
    map_location=device,
    weights_only=True
)

model.load_state_dict(checkpoint["model_state_dict"])
model.eval()

all_predictions = []
all_targets = []

with torch.no_grad():

    for images, targets in test_loader:

        images = images.to(device)

        with torch.autocast(
            device_type=device.type,
            enabled=(device.type == "cuda")
        ):
            outputs = model(images)

        predictions = outputs.argmax(dim=1)

        all_predictions.extend(predictions.cpu().tolist())
        all_targets.extend(targets.tolist())


# ============================================================
# 11. EVALUATION METRICS
# ============================================================

test_accuracy = accuracy_score(all_targets, all_predictions)

report = classification_report(
    all_targets,
    all_predictions,
    labels=list(range(num_classes)),
    target_names=class_names,
    zero_division=0
)

print("\n" + "=" * 60)
print("FINAL TEST RESULTS")
print("=" * 60)
print("Best epoch:", best_epoch)
print(f"Best validation accuracy: {best_val_acc:.4f}")
print(f"Test accuracy: {test_accuracy:.4f}")
print("\nClassification report:\n")
print(report)

with open(
    OUTPUT_DIR / "classification_report.txt",
    "w",
    encoding="utf-8"
) as file:
    file.write(report)
    file.write(f"\nTest accuracy: {test_accuracy:.4f}\n")


# ============================================================
# 12. CONFUSION MATRIX
# ============================================================

cm = confusion_matrix(
    all_targets,
    all_predictions,
    labels=list(range(num_classes))
)

plt.figure(figsize=(9, 7))

sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=class_names,
    yticklabels=class_names
)

plt.xlabel("Predicted Soil Class")
plt.ylabel("Actual Soil Class")
plt.title("EfficientNetV2-S Soil Classification")
plt.tight_layout()
plt.savefig(
    OUTPUT_DIR / "confusion_matrix.png",
    dpi=200
)
plt.close()


# ============================================================
# 13. SAVE CLASS NAMES
# ============================================================

with open(
    OUTPUT_DIR / "class_names.json",
    "w",
    encoding="utf-8"
) as file:
    json.dump(class_names, file, indent=2)


# ============================================================
# 14. FINISHED
# ============================================================

print("\n" + "=" * 60)
print("TRAINING COMPLETED SUCCESSFULLY")
print("=" * 60)

print("Best model:", best_model_path)
print("Output folder:", OUTPUT_DIR)
print("Accuracy curve:", OUTPUT_DIR / "accuracy_curve.png")
print("Loss curve:", OUTPUT_DIR / "loss_curve.png")
print("Confusion matrix:", OUTPUT_DIR / "confusion_matrix.png")
print("Classification report:", OUTPUT_DIR / "classification_report.txt")
print("Class names:", OUTPUT_DIR / "class_names.json")
print("Training history:", OUTPUT_DIR / "training_history.json")
