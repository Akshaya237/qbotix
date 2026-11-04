
from ultralytics import YOLO
import torch

if __name__ == "__main__":

    # GPU verification
    print("CUDA Available:", torch.cuda.is_available())

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA GPU not detected!")

    print("GPU:", torch.cuda.get_device_name(0))

    # Load YOLOv8 Nano
    model = YOLO("yolov8n.pt")

    # Train model
    results = model.train(
        data="data.yaml",

        epochs=150,
        imgsz=640,
        batch=8,

        device=0,
        workers=2,

        optimizer="AdamW",
        lr0=0.001,
        lrf=0.01,
        weight_decay=0.0005,

        patience=30,
        cos_lr=True,

        amp=True,
        cache=False,

        mosaic=1.0,
        close_mosaic=10,

        project="runs/cone_detection",
        name="yolov8n",
        exist_ok=True,

        save=True,
        plots=True
    )

    print("\nTraining completed!")
    print("Best model: runs/cone_detection/yolov8n/weights/best.pt")
