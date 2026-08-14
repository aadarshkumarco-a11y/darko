#!/usr/bin/env python3
"""Draw the detected bottom edge of the flag on each frame and stack them."""
from PIL import Image, ImageDraw
import numpy as np

FILES = [
    "/home/z/my-project/download/flag-frame-1.png",
    "/home/z/my-project/download/flag-frame-2.png",
    "/home/z/my-project/download/flag-frame-3.png",
]
SAFFRON = np.array([255, 153, 51], dtype=np.float32)
GREEN   = np.array([19, 136, 8],   dtype=np.float32)

def color_mask(arr, target, tol=45):
    diff = arr[..., :3].astype(np.float32) - target
    return np.sqrt((diff ** 2).sum(axis=-1)) < tol

def bottom_edge(mask):
    h, w = mask.shape
    prof = np.full(w, -1, dtype=np.int32)
    cols = np.where(mask.any(axis=0))[0]
    for c in cols:
        rows = np.where(mask[:, c])[0]
        if len(rows):
            prof[c] = rows.max()
    return prof, int(cols.min()), int(cols.max())

panels = []
profiles = []
for path in FILES:
    img = Image.open(path).convert("RGB")
    arr = np.array(img)
    mask = color_mask(arr, SAFFRON) | color_mask(arr, GREEN)
    prof, x0, x1 = bottom_edge(mask)
    profiles.append(prof)
    # Draw a thick red line along the bottom edge
    draw = ImageDraw.Draw(img)
    for c in range(x0, x1 + 1):
        if prof[c] >= 0:
            draw.rectangle([c - 1, prof[c] - 1, c + 1, prof[c] + 1], fill=(255, 0, 255))
    panels.append(img)

# Also make a pure comparison plot: just the 3 bottom edges on a black canvas
h, w = 900, 1440
overlay = Image.new("RGB", (w, h), (20, 20, 20))
draw = ImageDraw.Draw(overlay)
colors = [(255, 80, 80), (80, 255, 80), (80, 160, 255)]
labels = ["Frame 1 (t=0ms)", "Frame 2 (t=800ms)", "Frame 3 (t=1600ms)"]
for prof, color in zip(profiles, colors):
    pts = [(c, prof[c]) for c in range(len(prof)) if prof[c] >= 0]
    draw.line(pts, fill=color, width=3)
for color, label in zip(colors, labels):
    pass

# Stack the 3 annotated frames vertically with the overlay
gap = 10
total_h = panels[0].height * 3 + gap * 4 + overlay.height
canvas = Image.new("RGB", (w, total_h), (0, 0, 0))
y = 0
for p in panels:
    canvas.paste(p, (0, y))
    y += p.height + gap
canvas.paste(overlay, (0, y))
canvas.save("/home/z/my-project/download/flag-wave-comparison.png")
print("Saved: /home/z/my-project/download/flag-wave-comparison.png")
print(f"Canvas size: {canvas.size}")
